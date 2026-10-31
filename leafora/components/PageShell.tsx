"use client";

import { motion } from "framer-motion";
import Navigation from "./Navigation";
import Footer from "./Footer";

export default function PageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ paddingTop: "56px", minHeight: "100vh" }}
      >
        {children}
      </motion.main>
      <Footer />
    </>
  );
}
