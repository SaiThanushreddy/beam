import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => (
  <header className="absolute top-0 left-0 right-0 z-20 py-4 px-8">
    <div className="container mx-auto flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Sparkles className="w-8 h-8 text-rose-900" />
        <h1 className="text-2xl font-heading font-bold text-gray-900">Beam</h1>
      </div>
    </div>
  </header>
);

export default Header;
  