import React, { memo, useEffect, useRef, useState } from "react";
import moment from "moment";
import { IoShareSocialOutline } from "react-icons/io5";

import Plyr from "plyr-react";
import "plyr-react/plyr.css";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useInView } from "react-intersection-observer"; // Import hook



const EventCard = ({
    _id,
    event_title,
    event_description,
    created_by,
    event_video,
    thumbnail,
    category,
    ticket_price,
    event_date_and_time,
    event_duration,
    event_address,
    booked_tickets,
    handleFetchJoinedMembers,
    handleEventClick,
    handleShare,
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { ref: videoRef, inView: isInView } = useInView({ threshold: 0.1 }); // Detect when in view (reduced threshold)

    const playerRef = useRef(null);
    const [player, setPlayer] = useState(null);
    const [showVideo, setShowVideo] = useState(false); // State to control video display
    const [videoError, setVideoError] = useState(false);


//     useEffect(() => {
//     if (isInView && playerRef.current && !player && showVideo) {
//         const plyrInstance = playerRef.current.plyr;
//         setPlayer(plyrInstance);
//     }

//     return () => {
//         if (player) {
//             player.destroy();
//             setPlayer(null);
//         }
//     };
// }, [isInView, player, showVideo]);



  const handlePlayClick = () => {
    setShowVideo(true); // Will trigger useEffect to load player
};


    const handleImageError = () => {
        console.error("Error loading image:", thumbnail);
    };

    const handleVideoError = (e) => {
      console.error("Error playing video:", e);
      setVideoError(true);
      setShowVideo(false); // Hide video player on error, show thumbnail instead
    }

    return (
        <div className="relative" ref={videoRef}>
            <div
                className="absolute -top-5 -right-2 z-[1000] cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    if (user) {
                        navigate(`/user-profile/${created_by?._id}`);
                    } else {
                        toast.error("Please login to view user profile");
                        navigate("/login");
                    }
                }}
            >
                {created_by?.profile_picture ? (
                    <img
                        src={created_by?.profile_picture}
                        alt="profile"
                        loading="lazy"
                        className="w-12 h-12 rounded-full bg-gray-100 object-cover object-center"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                        {created_by?.fullname?.charAt(0)?.toUpperCase()}
                    </div>
                )}
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden transition-transform transform hover:scale-105">

            <div className="w-full aspect-w-16 aspect-h-9 overflow-hidden">

  {event_video && !showVideo ? (
    <div
      className="relative w-full h-full cursor-pointer"
      onClick={() => setShowVideo(true)}
    >
      <img
        src={thumbnail}
        alt="Video thumbnail"
        className="w-full h-full object-cover"
      />
     <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="w-16 h-16 text-white"
          fill="currentColor"
          viewBox="0 0 84 84"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="42" cy="42" r="42" fill="rgba(0,0,0,0.6)" />
          <polygon points="33,24 60,42 33,60" fill="white" />
        </svg>
      </div>
    </div>
  ) : (
   
     <div className="w-full aspect-w-16 aspect-h-9">

        <Plyr
          key={showVideo ? 'video-playing' : 'thumbnail'}
          source={{
            type: "video",
            sources: [{ src: event_video, type: "video/mp4" }],
          }}
          options={
    controls: [
      "play-large",
      "play",
      "progress",
      "current-time",
      "mute",
      "volume",
      "fullscreen",
    ],
     autoplay: showVideo, 
  }
        />
      </div>
    
  )}
  
</div>

                <div
                    onClick={() => handleEventClick(_id)}
                    className="p-4 cursor-pointer"
                >
                    <div className="flex justify-between items-center mb-2">
                        <span
                            className={`text-sm ${ticket_price === 0 ? "bg-green-500" : "bg-purple-500"
                                } text-white px-2 py-1 rounded font-semibold`}
                        >
                            {ticket_price === 0 ? "Free" : `R${ticket_price}`}
                        </span>
                        <span className="text-purple-700 bg-purple-100 px-2 py-1 rounded-full text-sm font-semibold">
                            {category}
                        </span>
                    </div>
                    <div className="mt-2">
                        <p className="text-sm text-gray-500">
                            {moment(event_date_and_time).format("DD MMM YYYY HH:mm")}
                        </p>
                        <h3 className="text-lg font-semibold text-gray-900 mt-1">
                            {event_title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {event_address?.address}
                        </p>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-3">{event_description}</p>
                    </div>
                </div>

                {/* Show Booked Users or No Attendees Message */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-x-3">
                            {booked_tickets && booked_tickets.length > 0 ? (
                                <div
                                    className="flex -space-x-1 overflow-hidden cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (user) {
                                            handleFetchJoinedMembers(_id);
                                        } else {
                                            toast.error("Please login to view members");
                                            navigate("/login");
                                        }
                                    }}
                                >
                                    {booked_tickets
                                        ?.filter(
                                            (user, index, self) =>
                                                index === self.findIndex((u) => u._id === user._id)
                                        )
                                        ?.slice(0, 3)
                                        ?.map((user, index) => (
                                            <div key={index}>
                                                <img
                                                    alt={user.fullname}
                                                    src={user.profile_picture}
													loading="lazy"
                                                    className="inline-block h-6 w-6 object-center object-cover rounded-full "
                                                />
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No one has joined yet</p>
                            )}
                            <p className="text-sm text-gray-500">
                                {booked_tickets && booked_tickets.length > 0
                                    ? `${booked_tickets.length} Members Joined`
                                    : ""}
                            </p>
                        </div>
                        {/* Share Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleShare(event_title, event_description, _id);
                            }}
                            className="bg-purple-500 text-white px-4 flex items-center gap-x-2 py-1.5 rounded-md font-medium hover:bg-purple-600"
                        >
                            <IoShareSocialOutline />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(EventCard);
