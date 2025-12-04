const Footer = () => (
  <footer className="absolute bottom-0 left-0 right-0 z-20 py-4 px-8">
    <div className="container mx-auto text-center text-sm text-gray-500">
      &copy; {new Date().getFullYear()} Beam. All rights reserved.
    </div>
  </footer>
);

export default Footer;
