/** @format */

import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/User/Users";
import AdminSettings from "./pages/AdminSettings";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./components/AdminLayout";
import AdminForgotPassword from "./components/AdminForgotPassword";
import AdminChangePassword from "./components/AdminChangePassword";
import AdminProfile from "./pages/AdminProfile";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import AdminsPage from "./pages/Admin/AdminsPage";
import ContactUsPage from "./pages/ContactUs/ContactUs";
import Places from "./pages/Places/Places";
import PlaceView from "./pages/Places/ViewPlaces";
import Businesses from "./pages/Business/Business";
import Blogs from "./pages/Blog/Blog";
import BlogCategories from "./pages/BlogCategory/BlogCategory";
import BlogForm from "./pages/Blog/Blogform";
import BlogView from "./pages/Blog/BlogView";
import BusinessRequests from "./pages/Businessrequests/Businessrequests";
import AdminForm from "./pages/Admin/Adminform";
import PlaceCategories from "./pages/PlaceCategory/PlaceCategories";
import BusinessCategories from "./pages/BusinessCategories/BusinessCategories";
import PlaceForm from "./pages/Places/PlaceForm";
import BusinessForm from "./pages/Business/BusinessForm";
import BusinessView from "./pages/Business/BusinessView";
import UserDetails from "./pages/User/UserDetails";
import UsersPage from "./pages/User/Users";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/forgot-password" element={<AdminForgotPassword />} />

          <Route
            path="/dashboard"
            element={
              <AdminLayout access="any">
                <Dashboard />
              </AdminLayout>
            }
          />
          <Route
            path="/change-password"
            element={
              <AdminLayout access="any">
                <AdminChangePassword />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/profile"
            element={
              <AdminLayout access="any">
                <AdminProfile />
              </AdminLayout>
            }
          />

          <Route
            path="/users"
            element={
              <AdminLayout>
                <UsersPage />
              </AdminLayout>
            }
          />

          <Route
            path="/users/:id"
            element={
              <AdminLayout>
                <UserDetails />
              </AdminLayout>
            }
          />

          <Route
            path="/settings"
            element={
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            }
          />

          <Route
            path="/admins"
            element={
              <AdminLayout access="superAdmin">
                <AdminsPage />
              </AdminLayout>
            }
          />

          <Route
            path="/contact-us"
            element={
              <AdminLayout>
                <ContactUsPage />
              </AdminLayout>
            }
          />

          <Route
            path="/place-categories"
            element={
              <AdminLayout>
                <PlaceCategories />
              </AdminLayout>
            }
          />

          <Route
            path="/places"
            element={
              <AdminLayout>
                <Places />
              </AdminLayout>
            }
          />
          <Route
            path="/places/:id"
            element={
              <AdminLayout>
                <PlaceView />
              </AdminLayout>
            }
          />

          <Route
            path="/places/add"
            element={
              <AdminLayout>
                <PlaceForm />
              </AdminLayout>
            }
          />

          <Route
            path="/places/:id/edit"
            element={
              <AdminLayout>
                <PlaceForm />
              </AdminLayout>
            }
          />

          <Route
            path="/businesses"
            element={
              <AdminLayout>
                <Businesses />
              </AdminLayout>
            }
          />

          <Route
            path="/businesses/add"
            element={
              <AdminLayout>
                <BusinessForm />
              </AdminLayout>
            }
          />

          <Route
            path="/businesses/:id"
            element={
              <AdminLayout>
                <BusinessView />
              </AdminLayout>
            }
          />

          <Route
            path="/businesses/:id/edit"
            element={
              <AdminLayout>
                <BusinessForm />
              </AdminLayout>
            }
          />

          <Route
            path="/business-categories"
            element={
              <AdminLayout>
                <BusinessCategories />
              </AdminLayout>
            }
          />

          <Route
            path="/blogs"
            element={
              <AdminLayout>
                <Blogs />
              </AdminLayout>
            }
          />

          <Route
            path="/blogs/add"
            element={
              <AdminLayout>
                <BlogForm />
              </AdminLayout>
            }
          />

          <Route
            path="/blogs/:id/edit"
            element={
              <AdminLayout>
                <BlogForm />
              </AdminLayout>
            }
          />

          <Route
            path="/blogs/:id"
            element={
              <AdminLayout>
                <BlogView />
              </AdminLayout>
            }
          />

          <Route
            path="/blog-categories"
            element={
              <AdminLayout>
                <BlogCategories />
              </AdminLayout>
            }
          />

          <Route
            path="/business-requests"
            element={
              <AdminLayout>
                <BusinessRequests />
              </AdminLayout>
            }
          />

          <Route
            path="/admins/add"
            element={
              <AdminLayout access="superAdmin">
                <AdminForm />
              </AdminLayout>
            }
          />

          <Route
            path="/admins/edit/:id"
            element={
              <AdminLayout access="superAdmin">
                <AdminForm />
              </AdminLayout>
            }
          />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
