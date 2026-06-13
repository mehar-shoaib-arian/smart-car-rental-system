import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useAppContext } from "../context/contextStore";
import { isGmailAddress, validationMessages } from "../utils/validators";

const Newsletter = () => {
  const { axios } = useAppContext();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Name validation: must start with alphabet (A-Z or a-z)
  const isValidName = (value) => /^[A-Za-z]/.test(value.trim());

  const onSubmit = async (e) => {
    e.preventDefault();

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Name validation
    if (!normalizedName) {
      toast.error("Name is required");
      return;
    }

    if (!isValidName(normalizedName)) {
      toast.error("Name must start with a letter (A-Z)");
      return;
    }

    // Email validation
    if (!normalizedEmail) return;

    if (!isGmailAddress(normalizedEmail)) {
      toast.error(validationMessages.gmail);
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.post("/api/newsletter/subscribe", {
        name: normalizedName,
        email: normalizedEmail,
      });

      if (data.success) {
        toast.success(data.message);
        setName("");
        setEmail("");
      } else {
        toast.error(data.message || "Subscription failed.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Subscription failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-2 max-md:px-4 my-10 mb-40">
      <h1 className="md:text-4xl text-2xl font-semibold">
        Never Miss a Deal!
      </h1>

      <p className="md:text-lg text-gray-500/70 pb-8">
        Subscribe to get the latest offers, new arrivals, and exclusive discounts
      </p>

      <form
        onSubmit={onSubmit}
        className="flex flex-col md:flex-row items-center justify-between max-w-2xl w-full gap-2"
      >
        {/* Name */}
        <input
          className="border border-gray-300 rounded-md h-12 w-full px-3 text-gray-500"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />

        {/* Email */}
        <input
          className="border border-gray-300 rounded-md h-12 w-full px-3 text-gray-500"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email id"
          required
        />

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className="md:px-12 px-8 h-12 text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer rounded-md disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {loading ? "Subscribing..." : "Subscribe"}
        </button>
      </form>
    </div>
  );
};

export default Newsletter;