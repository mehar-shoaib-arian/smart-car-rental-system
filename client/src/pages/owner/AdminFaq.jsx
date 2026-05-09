import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useAppContext } from "../../context/contextStore";
import Title from "../../components/owner/Title";

const emptyForm = { question: "", answer: "", keywords: "" };

const AdminFaq = () => {
  const { axios } = useAppContext();
  const [faqs, setFaqs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchFaqs = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/admin/faqs", {
        headers: getAuthHeaders(),
      });
      if (data.success) {
        setFaqs(data.faqs);
      } else {
        toast.error(data.message || "Failed to fetch FAQs.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch FAQs.");
    }
  }, [axios]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.question.trim() || !form.answer.trim() || !form.keywords.trim()) {
      toast.error("All fields are required.");
      return;
    }

    const keywordsArray = form.keywords
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);

    if (keywordsArray.length === 0) {
      toast.error("Please enter at least one keyword.");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Update existing FAQ
        const { data } = await axios.put(
          `/api/admin/faqs/${editingId}`,
          {
            question: form.question,
            answer: form.answer,
            keywords: keywordsArray,
          },
          { headers: getAuthHeaders() },
        );
        if (data.success) {
          toast.success("FAQ updated successfully.");
          fetchFaqs();
          resetForm();
        } else {
          toast.error(data.message || "Failed to update FAQ.");
        }
      } else {
        // Create new FAQ
        const { data } = await axios.post(
          "/api/admin/faqs",
          {
            question: form.question,
            answer: form.answer,
            keywords: keywordsArray,
          },
          { headers: getAuthHeaders() },
        );
        if (data.success) {
          toast.success("FAQ added successfully.");
          fetchFaqs();
          resetForm();
        } else {
          toast.error(data.message || "Failed to add FAQ.");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faq) => {
    setForm({
      question: faq.question,
      answer: faq.answer,
      keywords: faq.keywords.join(", "),
    });
    setEditingId(faq._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const { data } = await axios.delete(`/api/admin/faqs/${id}`, {
        headers: getAuthHeaders(),
      });
      if (data.success) {
        toast.success("FAQ deleted.");
        fetchFaqs();
      } else {
        toast.error(data.message || "Failed to delete FAQ.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete FAQ.");
    }
  };

  return (
    <div className="px-4 pt-10 md:px-10 w-full">
      <div className="flex items-center justify-between mb-2">
        <Title
          title="Manage FAQs"
          subtitle="Add, edit, or delete frequently asked questions for the chatbot."
        />
        <button
          onClick={() => {
            resetForm();
            setShowForm((prev) => !prev);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md cursor-pointer"
        >
          {showForm ? "Cancel" : "+ Add FAQ"}
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white border border-borderColor rounded-lg p-6 mb-8 max-w-2xl">
          <h2 className="text-base font-semibold mb-4 text-gray-700">
            {editingId ? "Edit FAQ" : "Add New FAQ"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500">Question</label>
              <input
                type="text"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="e.g. What documents are required?"
                className="border border-borderColor rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500">Answer</label>
              <textarea
                rows={4}
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                placeholder="e.g. You need a valid CNIC and driving license."
                className="border border-borderColor rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500">
                Keywords{" "}
                <span className="text-gray-400">
                  (comma separated, used by chatbot)
                </span>
              </label>
              <input
                type="text"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="e.g. documents, cnic, license, requirements"
                className="border border-borderColor rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400"
                required
              />
            </div>

            <div className="flex items-center gap-3 mt-1">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-md cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : editingId ? "Update FAQ" : "Add FAQ"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2 border border-borderColor text-sm rounded-md cursor-pointer hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAQs Table */}
      <div className="max-w-4xl w-full rounded-md overflow-hidden border border-borderColor mt-4">
        <table className="w-full border-collapse text-left text-sm text-gray-600">
          <thead className="text-gray-500 bg-gray-50">
            <tr>
              <th className="p-3 font-medium w-6">#</th>
              <th className="p-3 font-medium">Question</th>
              <th className="p-3 font-medium max-md:hidden">Answer</th>
              <th className="p-3 font-medium max-md:hidden">Keywords</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {faqs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  No FAQs found. Click "+ Add FAQ" to create one.
                </td>
              </tr>
            )}
            {faqs.map((faq, index) => (
              <tr
                key={faq._id}
                className="border-t border-borderColor hover:bg-gray-50"
              >
                <td className="p-3 text-gray-400">{index + 1}</td>
                <td className="p-3 font-medium max-w-xs">
                  <p className="line-clamp-2">{faq.question}</p>
                </td>
                <td className="p-3 max-md:hidden max-w-xs text-gray-500">
                  <p className="line-clamp-2">{faq.answer}</p>
                </td>
                <td className="p-3 max-md:hidden">
                  <div className="flex flex-wrap gap-1">
                    {faq.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-100"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(faq)}
                      className="px-3 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-xs rounded-md cursor-pointer border border-yellow-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(faq._id)}
                      className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-md cursor-pointer border border-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminFaq;
