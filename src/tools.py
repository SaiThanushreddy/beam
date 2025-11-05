import os
import tempfile
from pathlib import Path
from urllib.parse import urlparse

from beam import Image, Sandbox

image = (
    Image()
    .from_registry("node:20")
    .add_commands(
        [
            "apt-get update && apt-get install -y git curl",
            "git clone https://github.com/beam-cloud/react-vite-shadcn-ui.git /app",
            "cd /app && rm -f pnpm-lock.yaml && npm install && echo 'npm install done........'",
            "cd /app && npm install @tanstack/react-query react-router-dom recharts sonner zod react-hook-form @hookform/resolvers date-fns uuid",
        ]
    )
)

DEFAULT_CODE_PATH = "/app/src"
DEFAULT_PROJECT_ROOT = "/app"


def create_app_environment() -> dict:
    """
    Creates a new sandbox environment with Vite dev server.
    Configures Vite to work properly in Beam Cloud environment.
    """
    print("Creating app environment...")

    sandbox = Sandbox(
        name="lovable-clone",
        cpu=1,
        memory=1024,
        image=image,
        keep_warm_seconds=300,
    ).create()

    # Expose port and get URL
    url = sandbox.expose_port(3000)
    hostname = urlparse(url).hostname
    print(f"React app URL: {url}")
    print(f"Hostname: {hostname}")
    
    print(f"Starting Vite dev server...")
    
    # Start Vite dev server with Beam Cloud configuration
    sandbox.process.exec(
        "sh",
        "-c",
        "cd /app && __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=.beam.cloud npm run dev -- --host :: --port 3000",
    )

    print(f"✅ React app created and started successfully! Access it at: {url}")
    
    return {
        "url": url,
        "sandbox_id": sandbox.sandbox_id(),
    }


def load_code(sandbox_id: str) -> tuple[dict, str]:
    """
    Loads all code files from the sandbox.
    Returns a tuple of (file_map, package_json).
    """
    print(f"Loading code for sandbox {sandbox_id}")

    sandbox = Sandbox().connect(sandbox_id)
    sandbox.update_ttl(300)

    file_map = {}

    def _process_directory(dir_path: str):
        """Recursively process directory and load all files."""
        try:
            for file in sandbox.fs.list_files(dir_path):
                full_path = Path(dir_path) / file.name

                if file.is_dir:
                    # Recursively process subdirectories
                    _process_directory(str(full_path))
                else:
                    # Download file
                    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                        try:
                            sandbox.fs.download_file(str(full_path), temp_file.name)
                            temp_file.seek(0)
                            file_content = temp_file.read()
                            file_map[str(full_path)] = file_content
                        except Exception as e:
                            print(f"Error loading file {full_path}: {e}")
                        finally:
                            os.unlink(temp_file.name)
        except Exception as e:
            print(f"Error processing directory {dir_path}: {e}")

    _process_directory(DEFAULT_CODE_PATH)
    print(f"Loaded {len(file_map)} files from sandbox")

    # Load package.json
    package_json = "{}"
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        try:
            sandbox.fs.download_file(f"{DEFAULT_PROJECT_ROOT}/package.json", temp_file.name)
            temp_file.seek(0)
            package_json = temp_file.read().decode("utf-8")
        except Exception as e:
            print(f"Error loading package.json: {e}")
        finally:
            os.unlink(temp_file.name)

    return file_map, package_json


def edit_code(sandbox_id: str, code_map: dict) -> dict:
    """
    Edits code files in the sandbox.
    Creates parent directories if they don't exist.
    """
    print(f"Editing code for sandbox {sandbox_id}")
    print(f"Updating {len(code_map)} files...")

    sandbox = Sandbox().connect(sandbox_id)
    sandbox.update_ttl(300)

    for sandbox_path, content in code_map.items():
        with tempfile.NamedTemporaryFile(mode='w', delete=False, encoding='utf-8') as temp_file:
            try:
                # Write content to temp file
                if isinstance(content, bytes):
                    temp_file.write(content.decode('utf-8'))
                else:
                    temp_file.write(content)
                temp_file.flush()

                # Get parent directory and ensure it exists
                parent_dir = str(Path(sandbox_path).parent)
                try:
                    sandbox.fs.stat_file(parent_dir)
                except Exception:
                    # Parent directory doesn't exist, create it
                    print(f"Creating parent directory: {parent_dir}")
                    result = sandbox.process.exec("mkdir", "-p", parent_dir).wait()
                    if result.returncode != 0:
                        print(f"Warning: mkdir returned {result.returncode}")

                # Upload file to sandbox
                sandbox.fs.upload_file(temp_file.name, sandbox_path)
                print(f"✅ Updated: {sandbox_path}")
                
            except Exception as e:
                print(f"❌ Error updating {sandbox_path}: {e}")
            finally:
                os.unlink(temp_file.name)

    print(f"✅ Finished updating {len(code_map)} files")
    
    return {"sandbox_id": sandbox.sandbox_id()}


def _detect_language(file_path: str) -> str:
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


def _build_file_tree(sandbox, path: str) -> list[dict]:
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
                node["children"] = _build_file_tree(sandbox, full_path)
            else:
                node["language"] = _detect_language(file.name)
            
            tree.append(node)
        
        # Sort: directories first, then files alphabetically
        tree.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))
        return tree
        
    except Exception as e:
        print(f"Error building file tree for {path}: {e}")
        return []


def get_file_tree(sandbox_id: str) -> list[dict]:
    """Get the file tree structure from sandbox"""
    try:
        sandbox = Sandbox().connect(sandbox_id)
        sandbox.update_ttl(300)
        
        tree = _build_file_tree(sandbox, DEFAULT_CODE_PATH)
        return tree
        
    except Exception as e:
        print(f"Error getting file tree: {e}")
        return []


def get_file_content(sandbox_id: str, file_path: str) -> tuple[str, str]:
    """
    Get content of a specific file.
    Returns tuple of (content, language).
    """
    try:
        sandbox = Sandbox().connect(sandbox_id)
        sandbox.update_ttl(300)
        
        # Download file to temp location
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            sandbox.fs.download_file(file_path, tmp.name)
            
            with open(tmp.name, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Clean up temp file
            os.unlink(tmp.name)
        
        language = _detect_language(file_path)
        return content, language
        
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        raise


def save_file(sandbox_id: str, file_path: str, content: str) -> bool:
    """Save edited file back to sandbox"""
    try:
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
        
        print(f"✅ Saved file: {file_path}")
        return True
        
    except Exception as e:
        print(f"Error saving file {file_path}: {e}")
        return False