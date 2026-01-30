
export const getZegoToken = async (roomId, userId) => {
    try {
        const API_URL = import.meta.env.VITE_API_URL || `https://${window.location.hostname}:5000/api`;
        // Ensure we pass userId and roomId as query params
        const res = await fetch(`${API_URL}/zego/token?userId=${encodeURIComponent(userId)}&roomId=${encodeURIComponent(roomId)}`, {
            method: "GET",
        });
        if (!res.ok) {
            throw new Error(`Token fetch failed: ${res.statusText}`);
        }
        const data = await res.json();
        return { token: data.token, appID: data.appID };
    } catch (error) {
        console.error("Error getting Zego token", error);
        return null;
    }
};

export const createMeeting = async () => {
    // For Zego, we just need a unique Room ID. 
    // We can generate one randomly or use a timestamp.
    const roomId = "room_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    return { meetingId: roomId, err: null };
};