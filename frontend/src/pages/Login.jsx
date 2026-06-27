import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please enter your email and password.");
      return;
    }

    try {
      setSubmitting(true);
      await login(formData);
      toast.success("Logged in successfully.");
      navigate("/listings");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please try again.";

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-header">
        <div className="auth-logo">
          <ShoppingCart size={30} />
          <span>CampusCart</span>
        </div>
        <h1>Welcome back</h1>
        <p>Sign in to your account to continue</p>
      </section>

      <form className="auth-card" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            name="email"
            placeholder="your.email@university.edu"
            value={formData.email}
            onChange={handleChange}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
          />
        </label>

        <div className="auth-row">
          <span>Remember me</span>
          <button type="button" className="text-button">
            Forgot password?
          </button>
        </div>

        <button className="primary-button full" type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>

        <p className="auth-switch">
          New to CampusCart? <Link to="/register">Create an account</Link>
        </p>
      </form>

      <div className="auth-note">
        Use your university email for a safer campus marketplace.
      </div>
    </main>
  );
}