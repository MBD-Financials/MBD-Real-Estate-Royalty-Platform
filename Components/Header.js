import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBars,
  FaTimes,
  FaHome,
  FaStore,
  FaUser,
  FaSignOutAlt,
  FaCog,
  FaChevronDown,
  FaWallet,
} from "react-icons/fa";

import ConnectButton from "./ConnectButton";

export function Header({
  address,
  isConnected,
  connect,
  disconnect,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Dropdown animation variants
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 25,
      },
    },
  };

  return (
    <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800/50 sticky top-0 z-30 shadow-lg">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <motion.div
                className="flex shrink-0 items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="h-9 w-9 rounded-lg  flex items-center justify-center shadow-md group-hover:shadow-teal-500/20">
                  <img src="/logo.png" alt="" srcset="" />
                </div>
              </motion.div>
              <motion.span
                className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 hidden sm:block"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                BLOCKESTATE
              </motion.span>
            </Link>
          </div>

          {/* Wallet Connect/Disconnect */}
          <div className="flex items-center">
            {isConnected ? (
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  className="flex items-center px-3 py-2 border border-gray-700/50 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition shadow-sm"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="flex h-2 w-2 rounded-full bg-green-400 mr-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  </div>
                  <span className="text-sm font-medium text-gray-200">
                    {formatAddress(address)}
                  </span>
                  <FaChevronDown
                    className={`ml-2 h-3 w-3 text-gray-400 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </motion.button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 overflow-hidden"
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      <div className="py-1">
                        <Link href="/my-properties">
                          <motion.div
                            className="flex items-center w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors"
                            whileHover={{ x: 5 }}
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <FaUser className="mr-2 text-teal-400" />
                            <span>Profile</span>
                          </motion.div>
                        </Link>

                        <div className="border-t border-gray-700/50 my-1"></div>
                        <button
                          className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700/50 transition-colors"
                          onClick={() => {
                            disconnect();
                            setIsDropdownOpen(false);
                          }}
                        >
                          <motion.div
                            className="flex items-center w-full"
                            whileHover={{ x: 5 }}
                          >
                            <FaSignOutAlt className="mr-2" />
                            <span>Disconnect</span>
                          </motion.div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <ConnectButton />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// You can replace this with your actual ConnectButton component
// This is just a fallback if the component is not provided
const DefaultConnectButton = () => (
  <motion.button
    className="flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white font-medium shadow-md"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <FaWallet className="mr-2" />
    Connect Wallet
  </motion.button>
);

// // Use the provided ConnectButton or fall back to the default
// ConnectButton = ConnectButton || DefaultConnectButton;
