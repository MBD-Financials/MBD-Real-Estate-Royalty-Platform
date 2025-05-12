import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import HomeSection from "./HomeSection";

export function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0E0B12]">
      {address ? (
        <>
          <Header
            address={address}
            isConnected={isConnected}
            disconnect={disconnect}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />

          <div className="flex flex-1 overflow-hidden">
            <Sidebar
              address={address}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
              isMobileMenuOpen={isMobileMenuOpen}
              disconnect={disconnect}
              currentPath={router.pathname}
            />

            <main className="lg:pl-72 flex-1 overflow-y-auto p-4 md:p-6 lg:p-4 bg-[#0E0B12] text-white">
              <div className="max-w-7xl mx-auto">{children}</div>
            </main>
          </div>
        </>
      ) : (
        <HomeSection />
      )}
    </div>
  );
}
