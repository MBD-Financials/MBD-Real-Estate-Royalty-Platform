// pages/index.js (or landing.js)
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaHome,
  FaChartLine,
  FaShieldAlt,
  FaGlobe,
  FaWallet,
  FaUsers,
  FaRegListAlt,
  FaHandshake,
  FaArrowRight,
  FaCheck,
  FaLock,
  FaMoneyBillWave,
  FaQuestion,
  FaCertificate,
  FaCoins,
  FaArrowDown,
} from "react-icons/fa";

import { Header } from "./Header";

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => (
  <motion.div
    className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-lg h-full"
    whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  >
    <div className="h-14 w-14 rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center shadow-lg mb-5">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </motion.div>
);

// Testimonial Component
const Testimonial = ({ content, author, role, delay = 0 }) => (
  <motion.div
    className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6 shadow-md"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    viewport={{ once: true }}
  >
    <div className="flex mb-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-5 h-5 text-yellow-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    <p className="text-gray-300 italic mb-4">"{content}"</p>
    <div>
      <p className="font-semibold text-white">{author}</p>
      <p className="text-gray-500 text-sm">{role}</p>
    </div>
  </motion.div>
);

// FAQ Item Component
const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className="border-b border-gray-700/50 last:border-b-0">
    <button
      className="flex justify-between items-center w-full py-4 text-left font-medium focus:outline-none"
      onClick={onClick}
    >
      <span className="text-white flex items-center">
        <FaQuestion className="text-teal-400 mr-3 flex-shrink-0" />
        {question}
      </span>
      <svg
        className={`w-5 h-5 transform transition-transform duration-300 ${
          isOpen ? "rotate-180" : ""
        } text-gray-400`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
    {isOpen && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="pb-4 text-gray-400"
      >
        {answer}
      </motion.div>
    )}
  </div>
);

// Statistic Card Component
const StatCard = ({ value, label, icon, gradient }) => (
  <div className="text-center">
    <div
      className={`h-16 w-16 mx-auto rounded-full mb-4 flex items-center justify-center shadow-lg ${gradient}`}
    >
      {icon}
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-gray-400 text-sm">{label}</div>
  </div>
);

export default function LandingPage() {
  const { isConnected } = useAccount();

  // FAQ state
  const [openFAQ, setOpenFAQ] = useState(null);

  // Handle FAQ click
  const handleFAQClick = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  // FAQ data
  const faqs = [
    {
      question:
        "How does blockchain ensure the security of property transactions?",
      answer:
        "Blockchain technology provides immutable records of all transactions, creating a transparent and tamper-proof history of ownership. Smart contracts automate and enforce agreement terms, eliminating the need for intermediaries and reducing fraud risk. Every transaction is cryptographically secured and requires multiple validations before being added to the blockchain.",
    },
    {
      question: "What fees are associated with using the platform?",
      answer:
        "Our platform charges a small listing fee when you add a property to the marketplace. Additionally, a small percentage fee is applied to successful property sales. These fees are transparent and significantly lower than traditional real estate commissions. All fees are clearly displayed before you complete any transaction.",
    },
    {
      question: "How do royalties work for property sellers?",
      answer:
        "Property sellers can designate royalty holders who will receive a percentage of future sales. For example, if you sell a property and set a 2% royalty, you'll automatically receive 2% of the value each time that property is resold in the future. This creates a passive income stream for original sellers and can be split among multiple stakeholders.",
    },
    {
      question: "Can I buy fractional ownership of properties?",
      answer:
        "Yes, our platform supports fractional ownership, allowing you to purchase a percentage stake in high-value properties. This democratizes real estate investment by lowering the entry barrier and enables portfolio diversification across multiple properties with less capital.",
    },
    {
      question: "What types of properties are available on the platform?",
      answer:
        "Our marketplace supports various property types including residential homes, commercial buildings, industrial spaces, and land. Each listing includes detailed information about property specifications, location, price, and ownership history for transparent decision-making.",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black to-gray-900 opacity-90"></div>
          <div className="absolute inset-0 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center opacity-30 blur-sm"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <motion.div
              className="lg:w-1/2"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 leading-tight">
                Real Estate on the
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
                  Blockchain
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-xl">
                Revolutionizing property transactions with secure, transparent,
                and efficient blockchain technology. Buy, sell, and invest in
                real estate like never before.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href={isConnected ? "/dashboard" : "#get-started"}>
                  <motion.button
                    className="gradient-btn px-8 py-4 font-semibold rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isConnected ? "Go to Dashboard" : "Get Started"}{" "}
                    <FaArrowRight className="ml-2" />
                  </motion.button>
                </Link>
                <Link href="/marketplace">
                  <motion.button
                    className="px-8 py-4 font-semibold rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white flex items-center backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Explore Properties <FaHome className="ml-2" />
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="lg:w-1/2"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-teal-400/20 to-blue-500/20 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center shadow-lg">
                      <FaHome className="text-white text-xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      Featured Property
                    </h2>
                  </div>

                  <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden mb-4 shadow-lg">
                    <img
                      src="/images/10.jpg"
                      alt="Luxury Villa"
                      className="w-full h-full object-cover opacity-80"
                    />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">
                    Luxury Beachfront Villa
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Premium 5-bedroom property with direct beach access and
                    breathtaking ocean views.
                  </p>

                  <div className="flex flex-wrap gap-4 justify-between mb-6">
                    <div>
                      <p className="text-gray-400 text-sm">Price</p>
                      <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-300">
                        120 ETH
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Location</p>
                      <p className="text-white font-medium">Malibu, CA</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Size</p>
                      <p className="text-white font-medium">4,500 sq ft</p>
                    </div>
                  </div>

                  <Link href="/property/featured">
                    <motion.button
                      className="w-full py-3 px-4 bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white rounded-lg transition flex items-center justify-center font-medium shadow-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      View Property Details <FaArrowRight className="ml-2" />
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-black relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard
              value="500+"
              label="Properties Listed"
              icon={<FaRegListAlt className="text-white text-2xl" />}
              gradient="bg-gradient-to-r from-teal-500 to-cyan-500"
            />
            <StatCard
              value="$25M+"
              label="Transaction Volume"
              icon={<FaChartLine className="text-white text-2xl" />}
              gradient="bg-gradient-to-r from-blue-500 to-indigo-500"
            />
            <StatCard
              value="1,200+"
              label="Active Users"
              icon={<FaUsers className="text-white text-2xl" />}
              gradient="bg-gradient-to-r from-purple-500 to-pink-500"
            />
            <StatCard
              value="100%"
              label="Secure Transactions"
              icon={<FaShieldAlt className="text-white text-2xl" />}
              gradient="bg-gradient-to-r from-amber-500 to-orange-500"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-black relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              Revolutionary Features
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our blockchain-powered platform transforms the real estate market
              with innovative solutions for buyers, sellers, and investors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FaShieldAlt className="text-white text-2xl" />}
              title="Secure Transactions"
              description="Smart contracts ensure that every transaction is secure, transparent, and tamper-proof, eliminating fraud and reducing paperwork."
            />
            <FeatureCard
              icon={<FaGlobe className="text-white text-2xl" />}
              title="Global Marketplace"
              description="Access properties worldwide without geographical limitations. Buy, sell, and invest in real estate from anywhere in the world."
            />
            <FeatureCard
              icon={<FaMoneyBillWave className="text-white text-2xl" />}
              title="Fractional Ownership"
              description="Invest in high-value properties with fractional ownership, making real estate investment accessible to everyone."
            />
            <FeatureCard
              icon={<FaHandshake className="text-white text-2xl" />}
              title="Direct Transactions"
              description="Connect directly with buyers and sellers, eliminating intermediaries and reducing transaction costs significantly."
            />
            <FeatureCard
              icon={<FaCertificate className="text-white text-2xl" />}
              title="Royalty System"
              description="Earn passive income through our innovative royalty system that allows property sellers to benefit from future resales."
            />
            <FeatureCard
              icon={<FaCoins className="text-white text-2xl" />}
              title="Tokenized Assets"
              description="Properties are tokenized on the blockchain, allowing for seamless transfers, division, and verification of ownership."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              How It Works
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Simple steps to revolutionize your real estate experience with
              blockchain technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-lg relative"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="absolute -top-5 -left-5 h-12 w-12 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                1
              </div>
              <div className="pt-8">
                <h3 className="text-xl font-bold mb-3 text-white">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-400 mb-4">
                  Link your digital wallet to our platform with a single click.
                  We support MetaMask, WalletConnect, and other popular
                  providers.
                </p>
                <div className="flex items-center text-teal-400">
                  <FaWallet className="mr-2" />
                  <span className="font-medium">
                    Easy and secure authentication
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-lg relative md:mt-10"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="absolute -top-5 -left-5 h-12 w-12 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                2
              </div>
              <div className="pt-8">
                <h3 className="text-xl font-bold mb-3 text-white">
                  Browse or List Properties
                </h3>
                <p className="text-gray-400 mb-4">
                  Explore available properties or list your own on the
                  marketplace. Each listing includes verified information and
                  complete history.
                </p>
                <div className="flex items-center text-teal-400">
                  <FaHome className="mr-2" />
                  <span className="font-medium">
                    Detailed property insights
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-lg relative md:mt-20"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="absolute -top-5 -left-5 h-12 w-12 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                3
              </div>
              <div className="pt-8">
                <h3 className="text-xl font-bold mb-3 text-white">
                  Complete Transactions
                </h3>
                <p className="text-gray-400 mb-4">
                  Buy, sell, or invest in properties with secure smart contract
                  transactions. Ownership transfers happen instantly on the
                  blockchain.
                </p>
                <div className="flex items-center text-teal-400">
                  <FaHandshake className="mr-2" />
                  <span className="font-medium">
                    Fast and trustless execution
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-16 text-center">
            <Link href={isConnected ? "/dashboard" : "#get-started"}>
              <motion.button
                className="gradient-btn px-8 py-4 font-semibold rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                id="get-started"
              >
                Get Started Now
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-900 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              What Our Users Say
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Hear from property buyers, sellers, and investors who have
              experienced the future of real estate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Testimonial
              content="I sold my property in 3 days with no agent fees. The royalty feature means I'll continue earning from future sales. This platform is revolutionary!"
              author="Alex Thompson"
              role="Property Seller"
              delay={0.1}
            />
            <Testimonial
              content="Fractional ownership allowed me to invest in premium real estate that I couldn't afford before. The transparency of blockchain gives me complete confidence."
              author="Sarah Johnson"
              role="Real Estate Investor"
              delay={0.2}
            />
            <Testimonial
              content="Buying my first home was intimidating, but this platform made it simple and secure. I could verify the complete history of the property on the blockchain."
              author="Michael Chen"
              role="First-time Homebuyer"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-black relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Everything you need to know about our blockchain real estate
              platform.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden shadow-lg">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                onClick={() => handleFAQClick(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black opacity-70"></div>
          <div className="absolute inset-0 bg-[url('/images/cta-bg.jpg')] bg-cover bg-center opacity-30 blur-sm"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              Ready to Transform Your Real Estate Experience?
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join thousands of users who are already buying, selling, and
              investing in properties on the blockchain.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href={isConnected ? "/dashboard" : "#get-started"}>
                <motion.button
                  className="gradient-btn px-8 py-4 font-semibold rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isConnected ? "Go to Dashboard" : "Connect Wallet"}{" "}
                  <FaWallet className="ml-2" />
                </motion.button>
              </Link>
              <Link href="/marketplace">
                <motion.button
                  className="px-8 py-4 font-semibold rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center backdrop-blur-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Browse Properties <FaHome className="ml-2" />
                </motion.button>
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-8">
              <div className="flex items-center">
                <FaShieldAlt className="text-teal-400 mr-2" />
                <span className="text-gray-300">Secure</span>
              </div>
              <div className="flex items-center">
                <FaLock className="text-teal-400 mr-2" />
                <span className="text-gray-300">Private</span>
              </div>
              <div className="flex items-center">
                <FaGlobe className="text-teal-400 mr-2" />
                <span className="text-gray-300">Global</span>
              </div>
              <div className="flex items-center">
                <FaHandshake className="text-teal-400 mr-2" />
                <span className="text-gray-300">Trustless</span>
              </div>
              <div className="flex items-center">
                <FaMoneyBillWave className="text-teal-400 mr-2" />
                <span className="text-gray-300">Low Fees</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12 border-t border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center mr-3">
                  <FaHome className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">BlockEstate</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Revolutionizing real estate with blockchain technology for
                secure and transparent property transactions.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-teal-400 transition"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-teal-400 transition"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-teal-400 transition"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-teal-400 transition"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white text-lg font-semibold mb-4">
                Platform
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-teal-400 transition"
                  >
                    Browse Properties
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-teal-400 transition"
                  >
                    List Your Property
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-teal-400 transition"
                  >
                    My Dashboard
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-teal-400 transition"
                  >
                    Marketplace
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-teal-400 transition"
                  >
                    Royalty Management
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-lg font-semibold mb-4">
                Resources
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-teal-400 transition"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-teal-400 transition"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-teal-400 transition"
                  >
                    API Reference
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-teal-400 transition"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-teal-400 transition"
                  >
                    Community
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-teal-400 transition"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-teal-400 transition"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-teal-400 transition"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-teal-400 transition"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-teal-400 transition"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 mb-4 md:mb-0">
                &copy; {new Date().getFullYear()} BlockEstate. All rights
                reserved.
              </p>
              <div className="flex space-x-6">
                <a
                  href="#"
                  className="text-gray-500 hover:text-teal-400 transition"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="text-gray-500 hover:text-teal-400 transition"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="text-gray-500 hover:text-teal-400 transition"
                >
                  Cookies
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
