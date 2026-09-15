import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { MainLayout } from '@/layout/MainLayout';
import { Button } from '@/components/ui/button';

const HomePage: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-3xl font-bold">Reusable Full-Stack Template</h1>
    <p className="text-muted-foreground">
      React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Redux Toolkit + TanStack Query
    </p>
    <div className="flex gap-2">
      <Button>Primary Action</Button>
      <Button variant="outline">Outline Action</Button>
    </div>
  </div>
);

const AboutPage: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-semibold">About</h1>
    <p>Modular, decoupled frontend application template.</p>
    <Link to="/" className="text-primary underline">Back Home</Link>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
};
