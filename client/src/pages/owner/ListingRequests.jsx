import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Title from "../../components/Tittle";
import { useAppContext } from "../../context/contextStore";

const formatCnic = (cnic = "") => {
  const digits = String(cnic).replace(/\D/g, "");

  if (digits.length !== 13) return cnic;

  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

const ListingRequests = () => {
  const { axios } = useAppContext();
  const [requests, setRequests] = useState([]);

  const fetchRequests = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("token");
      const { data } = await axios.get("/api/owner/listing-requests", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (data.success) {
        setRequests(data.requests);
      } else {
        toast.error(data.message || "Failed to fetch listing requests.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch requests.");
    }
  }, [axios]);

  const reviewRequest = async (requestId, status) => {
    try {
      const token = sessionStorage.getItem("token");
      const { data } = await axios.put(
        `/api/owner/listing-requests/${requestId}`,
        { status },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      if (data.success) {
        toast.success(data.message);
        fetchRequests();
      } else {
        toast.error(data.message || "Failed to update request.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update request.");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="px-4 pt-10 md:px-10 w-full">
      <Title
        title="Manage Listing Cars"
        subTitle="Review user-submitted car listings and approve or reject them."
        align="left"
      />

      <div className="max-w-6xl w-full rounded-md overflow-hidden border border-borderColor mt-6">
        <table className="w-full border-collapse text-left text-sm text-gray-600">
          <thead className="text-gray-500">
            <tr>
              <th className="p-3 font-medium">Owner</th>
              <th className="p-3 font-medium">Car</th>
              <th className="p-3 font-medium max-md:hidden">Location</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request._id} className="border-t border-borderColor">
                <td className="p-3">
                  <p className="font-medium">{request.fullName}</p>
                  <p className="text-xs text-gray-500">{request.email}</p>
                  <p className="text-xs text-gray-500">
                    CNIC: {formatCnic(request.cnic)}
                  </p>
                </td>
                <td className="p-3">
                  <p className="font-medium">
                    {request.brand} {request.model}
                  </p>
                  <p className="text-xs text-gray-500">
                    {request.year} | {request.category}
                  </p>
                </td>
                <td className="p-3 max-md:hidden">{request.location}</td>
                <td className="p-3">{request.pricePerDay}/day</td>
                <td className="p-3 capitalize">{request.status}</td>
                <td className="p-3">
                  {request.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => reviewRequest(request._id, "approved")}
                        className="px-3 py-1 rounded-md bg-green-100 text-green-700 cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => reviewRequest(request._id, "rejected")}
                        className="px-3 py-1 rounded-md bg-red-100 text-red-700 cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-500">Reviewed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListingRequests;
