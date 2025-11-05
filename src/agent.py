import json
import os
import tempfile
import time
import uuid
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

from beam import Image, PythonVersion, realtime, Sandbox

from baml_client.sync_client import BamlSyncClient, b
from baml_client.types import Message as ConvoMessage

from .tools import create_app_environment, edit_code, load_code, DEFAULT_CODE_PATH


class MessageType(Enum):
    INIT = "init"
    USER = "user"
    AGENT_PARTIAL = "agent_partial"
    AGENT_FINAL = "agent_final"
    LOAD_CODE = "load_code"
    EDIT_CODE = "edit_code"
    UPDATE_IN_PROGRESS = "update_in_progress"
    UPDATE_FILE = "update_file"
    UPDATE_COMPLETED = "update_completed"
    GET_FILE_TREE = "get_file_tree"
    FILE_TREE = "file_tree"
    GET_FILE_CONTENT = "get_file_content"
    FILE_CONTENT = "file_content"
    SAVE_FILE = "save_file"
    FILE_SAVED = "file_saved"
    ERROR = "error"


@dataclass
class Message:
    id: str
    timestamp: int
    type: MessageType
    data: dict
    session_id: str

    @classmethod
    def new(
        cls,
        type: MessageType,
        data: dict,
        id: str | None = None,
        session_id: str | None = None,
    ) -> "Message":
        return cls(
            type=type,
            data=data,
            id=id or str(uuid.uuid4()),
            timestamp=time.time_ns() // 1_000_000,
            session_id=session_id or str(uuid.uuid4()),
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "type": self.type.value,
            "data": self.data,
            "timestamp": self.timestamp,
            "session_id": self.session_id,
        }


class Agent:
    def __init__(self):
        self.model_client: BamlSyncClient = b
        self.session_data: dict = {}  
        self.history: list[dict] = []

    async def init(self, session_id: str) -> bool:
        exists = await self.create_app_environment(session_id)
        return exists

    async def create_app_environment(self, session_id: str):
        if session_id not in self.session_data:
            self.session_data[session_id] = create_app_environment()
            return False

        return True

    async def load_code(self, *, session_id: str):
        sandbox_id = self.session_data[session_id]["sandbox_id"]
        return load_code(sandbox_id)

    async def edit_code(self, *, session_id: str, code_map: dict):
        sandbox_id = self.session_data[session_id]["sandbox_id"]
        return edit_code(sandbox_id, code_map)

    async def add_to_history(self, user_feedback: str, agent_plan: str):
        self.history.append(
            {
                "role": "user",
                "content": user_feedback,
            }
        )

        self.history.append(
            {
                "role": "assistant",
                "content": agent_plan,
            }
        )

    def get_history(self):
        return [
            ConvoMessage(role=msg["role"], content=msg["content"])
            for msg in self.history
        ]

    def _detect_language(self, file_path: str) -> str:
        """Detect programming language from file extension"""
        ext_map = {
            ".py": "python",
            ".js": "javascript",
            ".ts": "typescript",
            ".jsx": "javascript",
            ".tsx": "typescript",
            ".html": "html",
            ".css": "css",
            ".json": "json",
            ".md": "markdown",
            ".yaml": "yaml",
            ".yml": "yaml",
            ".txt": "plaintext",
            ".sh": "shell",
            ".env": "plaintext",
        }
        ext = os.path.splitext(file_path)[1]
        return ext_map.get(ext, "plaintext")

    def _build_file_tree(self, sandbox, path: str) -> list[dict]:
        """Recursively build file tree structure"""
        try:
            files = sandbox.fs.list_files(path)
            tree = []
            
            for file in files:
                # Skip node_modules and .git directories
                if file.name in ["node_modules", ".git", "dist", "build"]:
                    continue
                    
                full_path = f"{path}/{file.name}" if not path.endswith('/') else f"{path}{file.name}"
                
                node = {
                    "name": file.name,
                    "path": full_path,
                    "is_dir": file.is_dir,
                    "size": file.size if not file.is_dir else None,
                    "type": "folder" if file.is_dir else "file"
                }
                
                if file.is_dir:
                    # Recursively get subdirectory contents
                    node["children"] = self._build_file_tree(sandbox, full_path)
                else:
                    node["language"] = self._detect_language(file.name)
                
                tree.append(node)
            
            # Sort: directories first, then files alphabetically
            tree.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))
            return tree
            
        except Exception as e:
            print(f"Error building file tree for {path}: {e}")
            return []

    async def get_file_tree(self, *, session_id: str):
        """Get the file tree structure from sandbox"""
        try:
            sandbox_id = self.session_data[session_id]["sandbox_id"]
            sandbox = Sandbox().connect(sandbox_id)
            sandbox.update_ttl(300)
            
            tree = self._build_file_tree(sandbox, DEFAULT_CODE_PATH)
            
            return Message.new(
                MessageType.FILE_TREE,
                {
                    "tree": tree,
                    "root": DEFAULT_CODE_PATH
                },
                session_id=session_id,
            ).to_dict()
            
        except Exception as e:
            print(f"Error getting file tree: {e}")
            return Message.new(
                MessageType.ERROR,
                {"text": f"Failed to get file tree: {str(e)}"},
                session_id=session_id,
            ).to_dict()

    async def get_file_content(self, *, session_id: str, file_path: str):
        """Get content of a specific file"""
        try:
            sandbox_id = self.session_data[session_id]["sandbox_id"]
            sandbox = Sandbox().connect(sandbox_id)
            sandbox.update_ttl(300)
            
            # Download file to temp location
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                sandbox.fs.download_file(file_path, tmp.name)
                
                with open(tmp.name, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Clean up temp file
                os.unlink(tmp.name)
            
            return Message.new(
                MessageType.FILE_CONTENT,
                {
                    "path": file_path,
                    "content": content,
                    "language": self._detect_language(file_path)
                },
                session_id=session_id,
            ).to_dict()
            
        except Exception as e:
            print(f"Error reading file {file_path}: {e}")
            return Message.new(
                MessageType.ERROR,
                {"text": f"Failed to read file: {str(e)}"},
                session_id=session_id,
            ).to_dict()

    async def save_file(self, *, session_id: str, file_path: str, content: str):
        """Save edited file back to sandbox"""
        try:
            sandbox_id = self.session_data[session_id]["sandbox_id"]
            sandbox = Sandbox().connect(sandbox_id)
            sandbox.update_ttl(300)
            
            # Write content to temp file
            with tempfile.NamedTemporaryFile(mode='w', delete=False, encoding='utf-8') as tmp:
                tmp.write(content)
                tmp.flush()
                
                # Ensure parent directory exists
                parent_dir = str(Path(file_path).parent)
                try:
                    sandbox.fs.stat_file(parent_dir)
                except Exception:
                    print(f"Creating parent directory: {parent_dir}")
                    sandbox.process.exec("mkdir", "-p", parent_dir).wait()
                
                # Upload file to sandbox
                sandbox.fs.upload_file(tmp.name, file_path)
                
                # Clean up temp file
                os.unlink(tmp.name)
            
            return Message.new(
                MessageType.FILE_SAVED,
                {
                    "path": file_path,
                    "success": True
                },
                session_id=session_id,
            ).to_dict()
            
        except Exception as e:
            print(f"Error saving file {file_path}: {e}")
            return Message.new(
                MessageType.ERROR,
                {"text": f"Failed to save file: {str(e)}"},
                session_id=session_id,
            ).to_dict()

    async def send_feedback(self, *, session_id: str, feedback: str):
        yield Message.new(MessageType.UPDATE_IN_PROGRESS, {}).to_dict()

        code_map, package_json = await self.load_code(session_id=session_id)

        code_files = []
        for path, content in code_map.items():
            code_files.append({"path": path, "content": str(content)})

        history = self.get_history()
        stream = self.model_client.stream.EditCode(
            history, feedback, code_files, package_json
        )
        sent_plan = False

        new_code_map = {}
        plan_msg_id = str(uuid.uuid4())
        file_msg_id = str(uuid.uuid4())

        for partial in stream:
            if partial.plan.state != "Complete" and not sent_plan:
                yield Message.new(
                    MessageType.AGENT_PARTIAL,
                    {"text": partial.plan.value},
                    id=plan_msg_id,
                    session_id=session_id,
                ).to_dict()

            if partial.plan.state == "Complete" and not sent_plan:
                yield Message.new(
                    MessageType.AGENT_FINAL,
                    {"text": partial.plan.value},
                    id=plan_msg_id,
                    session_id=session_id,
                ).to_dict()

                await self.add_to_history(feedback, partial.plan.value)

                sent_plan = True

            for file in partial.files:
                if file.path not in new_code_map:
                    yield Message.new(
                        MessageType.UPDATE_FILE,
                        {"text": f"Working on {file.path}"},
                        id=file_msg_id,
                        session_id=session_id,
                    ).to_dict()

                    new_code_map[file.path] = file.content

        await self.edit_code(session_id=session_id, code_map=new_code_map)

        yield Message.new(
            MessageType.UPDATE_COMPLETED, {}, session_id=session_id
        ).to_dict()


async def _load_agent():
    agent = Agent()
    print("Loaded agent")
    return agent


@realtime(
    name="beam",
    cpu=1.0,
    memory=1024,
    on_start=_load_agent,
    image=Image(
        python_packages="requirements.txt", python_version=PythonVersion.Python312
    ),
    secrets=["OPENAI_API_KEY", "ANTHROPIC_API_KEY"],
    concurrent_requests=1000,
    keep_warm_seconds=300,
)
async def handler(event, context):
    agent: Agent = context.on_start_value
    msg = json.loads(event)

    match msg.get("type"):
        case MessageType.USER.value:
            session_id = msg["data"]["session_id"]

            return agent.send_feedback(
                session_id=session_id,
                feedback=msg["data"]["text"],
            )
            
        case MessageType.INIT.value:
            session_id = msg["data"]["session_id"]
            exists = await agent.init(session_id=session_id)

            data = agent.session_data[session_id]
            data["exists"] = exists

            return Message.new(
                MessageType.INIT,
                session_id=session_id,
                data=data,
            ).to_dict()

        case MessageType.LOAD_CODE.value:
            session_id = msg["data"]["session_id"]

            code_map = await agent.load_code(
                session_id=session_id,
            )

            return Message.new(MessageType.LOAD_CODE, code_map).to_dict()
            
        case MessageType.GET_FILE_TREE.value:
            session_id = msg["data"]["session_id"]
            return await agent.get_file_tree(session_id=session_id)
            
        case MessageType.GET_FILE_CONTENT.value:
            session_id = msg["data"]["session_id"]
            file_path = msg["data"]["path"]
            return await agent.get_file_content(
                session_id=session_id,
                file_path=file_path
            )
            
        case MessageType.SAVE_FILE.value:
            session_id = msg["data"]["session_id"]
            file_path = msg["data"]["path"]
            content = msg["data"]["content"]
            return await agent.save_file(
                session_id=session_id,
                file_path=file_path,
                content=content
            )
            
        case _:
            return {}