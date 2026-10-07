import React from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-8xl font-bold text-gradient mb-4">404</h1>
      <p className="text-gray-400 text-lg mb-6">Page not found.</p>
      <a href="/" className="gradient-cta text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity">
        ← Go Home
      </a>
    </div>
  ),
});
