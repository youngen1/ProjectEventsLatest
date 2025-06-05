import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import TicketCard from "./TicketCard";
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";

const MyTickets = () => {
  const [myTickets, setMyTickets] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const paginatedTickets = myTickets.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    axiosInstance.get("/users/my-tickets").then((res) => {
      console.log("my-tickets", res?.data);
      setMyTickets(res?.data);
    });
  }, []);

  return (
    <div>
      <NavBar />
      <div className="py-24 bg-gray-100 min-h-screen ">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-6">
            <h2 className="text-2xl font-semibold">My Tickets</h2>
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedTickets.length > 0 ? (
              paginatedTickets.map((ticket) => (
                <TicketCard key={ticket?._id} ticket={ticket} />
              ))
            ) : (
              <p className="text-gray-500 col-span-full">No tickets found.</p>
            )}
          </div>
          {myTickets.length > pageSize && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() =>
                  setPage((p) =>
                    p < Math.ceil(myTickets.length / pageSize) ? p + 1 : p
                  )
                }
                disabled={page >= Math.ceil(myTickets.length / pageSize)}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
