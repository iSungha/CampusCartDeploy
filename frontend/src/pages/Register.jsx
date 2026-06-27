import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function validateForm() {
    if (!formData.name.trim()) {
      return "Full name is required.";
    }

    if (!formData.email.trim()) {
      return "Email is required.";
    }

    if (!formData.email.toLowerCase().endsWith("@dal.ca")) {
      return "Please use a valid Dalhousie university email ending in @dal.ca.";
    }

    if (formData.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match.";
    }

    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSubmitting(true);

      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      toast.success("Account created successfully.");
      navigate("/listings");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Registration failed. Please try again.";

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
        <h1>Create your CampusCart account</h1>
        <p>Use your university email to join the marketplace</p>
      </section>

      <form className="auth-card" onSubmit={handleSubmit}>
        <label>
          Full name
          <input
            type="text"
            name="name"
            placeholder="Jordan Smith"
            value={formData.name}
            onChange={handleChange}
          />
        </label>

        <label>
          University email
          <input
            type="email"
            name="email"
            placeholder="name@dal.ca"
            value={formData.email}
            onChange={handleChange}
          />
          <small>Use a valid university email address.</small>
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={handleChange}
          />
          <small>Password must be at least 8 characters.</small>
        </label>

        <label>
          Confirm password
          <input
            type="password"
            name="confirmPassword"
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </label>

        <div className="role-note">Role: Student</div>

        <button className="primary-button full" type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Create Account"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}