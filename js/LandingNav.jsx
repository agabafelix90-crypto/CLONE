import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import logo from '@/assets/medicore-logo.svg';
import './LandingNav.css';

const LandingNav = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setOpen(false);
  const handleNavigate = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <nav className="landing-nav glass-card fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <Link to="/" className="flex items-center gap-3 landing-nav__brand">
          <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 p-1.5 flex items-center justify-center shadow-sm landing-nav__logo">
            <img src={logo} alt="MediCore" className="h-full w-full object-contain" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">MediCoreSystem</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 landing-nav__links">
          <a href="#features" onClick={closeMenu} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" onClick={closeMenu} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          <a href="#about" onClick={closeMenu} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</a>
          <a href="#testimonials" onClick={closeMenu} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
          <a href="#contact" onClick={closeMenu} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</a>
        </div>

        <div className="hidden md:flex items-center gap-3 landing-nav__actions">
          <button onClick={() => handleNavigate('/login')} className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">Login</button>
          <button onClick={() => handleNavigate('/register')} className="px-5 py-2 text-sm font-semibold rounded-lg gradient-hero text-primary-foreground hover:opacity-90 transition-opacity">Register Now</button>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-foreground landing-nav__menu-btn">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden px-4 pb-4 flex flex-col gap-3 glass-card landing-nav__mobile-menu"
        >
          <a href="#features" onClick={closeMenu} className="text-sm font-medium text-muted-foreground py-2">Features</a>
          <a href="#pricing" onClick={closeMenu} className="text-sm font-medium text-muted-foreground py-2">Pricing</a>
          <a href="#about" onClick={closeMenu} className="text-sm font-medium text-muted-foreground py-2">About</a>
          <a href="#testimonials" onClick={closeMenu} className="text-sm font-medium text-muted-foreground py-2">Testimonials</a>
          <a href="#contact" onClick={closeMenu} className="text-sm font-medium text-muted-foreground py-2">Contact</a>
          <button onClick={() => handleNavigate('/login')} className="text-sm font-medium text-foreground py-2 text-left landing-nav__button landing-nav__button--mobile">Login</button>
          <button onClick={() => handleNavigate('/register')} className="px-5 py-2 text-sm font-semibold rounded-lg gradient-hero text-primary-foreground w-fit landing-nav__button--primary">Register Now</button>
        </motion.div>
      )}
    </nav>
  );
};

export default LandingNav;
