import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useContract } from "../hooks/useContract";
import {
  FaHome,
  FaStore,
  FaBuilding,
  FaPlus,
  FaCoins,
  FaFileContract,
  FaUserShield,
  FaCog,
  FaQuestionCircle,
  FaTimes,
  FaChevronRight,
  FaBars,
  FaSignOutAlt,
} from "react-icons/fa";

export function Sidebar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  currentPath,
  address,
  disconnect,
}) {
  const [activeGroup, setActiveGroup] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { contract, writeContract } = useContract();
  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPath, setIsMobileMenuOpen]);

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (contract && address) {
        try {
          const contractOwner = await contract.owner();
          setIsAdmin(contractOwner.toLowerCase() === address.toLowerCase());
        } catch (error) {
          console.error("Error checking admin status:", error);
        } finally {
        }
      }
    };

    if (contract && address) {
      checkAdmin();
    }
  }, [contract, address]);

  // Navigation items
  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: <FaHome className="h-5 w-5" />,
    },
    {
      name: "Marketplace",
      href: "/marketplace",
      icon: <FaStore className="h-5 w-5" />,
    },
    {
      name: "My Properties",
      href: "/my-properties",
      icon: <FaBuilding className="h-5 w-5" />,
    },
    {
      name: "Add Property",
      href: "/add-property",
      icon: <FaPlus className="h-5 w-5" />,
    },
    {
      name: "My Investments",
      href: "/my-investments",
      icon: <FaCoins className="h-5 w-5" />,
    },
    {
      name: "Royalties",
      href: "/royalties",
      icon: <FaFileContract className="h-5 w-5" />,
    },
  ];

  // Admin navigation items
  const adminNavigation = [
    {
      name: "Admin Panel",
      href: "/admin",
      icon: <FaUserShield className="h-5 w-5" />,
    },
  ];

  // Helper function to determine if a link is active
  const isActive = (path) => {
    if (path === "/" && currentPath === "/") {
      return true;
    }
    return currentPath.startsWith(path) && path !== "/";
  };

  // Determine if Admin section should be shown
  const shouldShowAdmin = isAdmin;

  // Animation variants for sidebar links
  const sidebarLinkVariants = {
    hover: {
      x: 6,
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
    tap: { scale: 0.95 },
  };

  // Mobile overlay animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  // Mobile sidebar animation variants
  const mobileSidebarVariants = {
    hidden: { x: "-100%" },
    visible: {
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  // SidebarLink component
  const SidebarLink = ({ item, isMobile = false }) => (
    <motion.div
      whileHover="hover"
      whileTap="tap"
      variants={sidebarLinkVariants}
    >
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
          isActive(item.href)
            ? "bg-gradient-to-r from-teal-500/20 to-blue-500/20 text-white border-l-4 border-teal-400"
            : "text-gray-400 hover:text-white hover:bg-gray-800/40"
        }`}
        onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
      >
        <span
          className={`${
            isActive(item.href) ? "text-teal-400" : "text-gray-500"
          }`}
        >
          {item.icon}
        </span>
        <span>{item.name}</span>
        {isActive(item.href) && (
          <motion.span
            className="ml-auto"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FaChevronRight className="h-3 w-3 text-teal-400" />
          </motion.span>
        )}
      </Link>
    </motion.div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-10">
        <motion.div
          className="flex-1 flex flex-col min-h-0 bg-gray-900/80 backdrop-blur-md border-r border-gray-800/50 shadow-xl"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex-1 flex flex-col pt-20 pb-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {/* Main Navigation */}
            <nav className="mt-2 flex-1 px-2 space-y-1.5">
              <div className="mb-4">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Main Navigation
                </h3>
                {navigation.map((item) => (
                  <SidebarLink key={item.name} item={item} />
                ))}
              </div>

              {/* Admin Section */}
              {shouldShowAdmin && (
                <div className="pt-4 mt-4 border-t border-gray-800/50">
                  <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Administration
                  </h3>
                  {adminNavigation.map((item) => (
                    <SidebarLink key={item.name} item={item} />
                  ))}
                </div>
              )}
            </nav>
          </div>

          {/* Footer with Help and Logout */}
          <div className="px-2 pb-4 border-t border-gray-800/50 pt-4">
            <motion.div
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-gray-400 hover:text-white hover:bg-gray-800/40 mt-1"
              whileHover="hover"
              whileTap="tap"
              variants={sidebarLinkVariants}
              onClick={() => {
                disconnect();
              }}
            >
              <FaSignOutAlt className="h-5 w-5 text-gray-500" />
              <span>Disconnect</span>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-y-0 left-0 max-w-xs w-full z-30 flex flex-col bg-gray-900/95 backdrop-blur-md border-r border-gray-800/50 shadow-2xl md:hidden"
            variants={mobileSidebarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Close button */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full bg-gray-800/50 text-gray-400 hover:text-white"
              >
                <FaTimes className="h-5 w-5" />
                <span className="sr-only">Close menu</span>
              </button>
            </div>

            {/* Logo and Brand */}
            <div className="flex items-center justify-center h-20 px-4 border-b border-gray-800/50">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-teal-400 to-blue-500 rounded-lg p-2 shadow-lg">
                  <FaHome className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                  BlockEstate
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-2">
              <div className="mb-4">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Main Navigation
                </h3>
                {navigation.map((item) => (
                  <SidebarLink key={item.name} item={item} isMobile={true} />
                ))}
              </div>

              {/* Admin Section */}
              {shouldShowAdmin && (
                <div className="pt-4 mt-4 border-t border-gray-800/50">
                  <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Administration
                  </h3>
                  {adminNavigation.map((item) => (
                    <SidebarLink key={item.name} item={item} isMobile={true} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Help and Logout */}
            <div className="px-2 pb-4 border-t border-gray-800/50 pt-4">
              <motion.div
                onClick={() => {
                  disconnect();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-gray-400 hover:text-white hover:bg-gray-800/40 mt-1"
                whileHover="hover"
                whileTap="tap"
                variants={sidebarLinkVariants}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaSignOutAlt className="h-5 w-5 text-gray-500" />
                <span>Logout</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu button - fixed at the bottom */}
      <div className="fixed bottom-4 left-4 z-10 md:hidden">
        <motion.button
          onClick={() => setIsMobileMenuOpen(true)}
          className="bg-gradient-to-r from-teal-500 to-blue-500 text-white p-3 rounded-full shadow-lg flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaBars className="h-6 w-6" />
        </motion.button>
      </div>
    </>
  );
}
