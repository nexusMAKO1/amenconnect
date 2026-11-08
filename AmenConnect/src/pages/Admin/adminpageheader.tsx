"use client"

import React, { useState, useRef, useEffect } from "react";
import { IonIcon } from "@ionic/react";
import { notificationsOutline, closeOutline, checkmarkOutline } from "ionicons/icons";
import { io } from "socket.io-client";
import "./adminpageheader.css";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface AdminPageHeaderProps {
  title: string;
  subtitle: string;
}

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ title, subtitle }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminName, setAdminName] = useState("Admin"); // default admin name
  const notificationRef = useRef<HTMLDivElement>(null);

  // Calculate unread notifications count
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  // Toggle notifications dropdown
  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  // Mark a single notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  };

  // Fetch initial notifications from the backend API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/admin/notifications", { credentials: "include" });
        if (!res.ok) {
          console.error("Error fetching notifications");
          return;
        }
        const data = await res.json();
        // Transform the backend data to match the Notification interface
        const formatted = data.notifications.map((notif: any) => ({
          id: notif._id,
          title: notif.title || "Nouvelle demande de vidéoconférence",
          message: notif.message,
          time: new Date(notif.createdAt).toLocaleString(),
          read: notif.read,
        }));
        setNotifications(formatted);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    fetchNotifications();
  }, []);

  // Set up Socket.IO connection for real-time notifications
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (typeof window !== "undefined" ? window.location.origin : "");
    const socket = io(socketUrl, { path: "/socket.io" });

    socket.on("connect", () => {
      // connection established
    });

    socket.on("new_notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch admin profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/admin/profile", { credentials: "include" });
        if (!res.ok) {
          console.error("Error fetching admin profile");
          return;
        }
        const data = await res.json();
        // Assuming your response contains an admin object with a name field
        setAdminName(data.admin.name);
      } catch (error) {
        console.error("Failed to fetch admin profile", error);
      }
    };
    fetchProfile();
  }, []);

  // Close notifications when clicking outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="admin-dashboard-header">
      <div className="admin-header-title">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="admin-header-actions">
        <div className="admin-notification-wrapper" ref={notificationRef}>
          <div className="admin-notification-trigger" onClick={toggleNotifications}>
            <div className="admin-notification-icon-wrapper">
              <IonIcon icon={notificationsOutline} className="admin-header-icon" />
              {unreadCount > 0 && <span className="admin-notification-badge">{unreadCount}</span>}
            </div>
          </div>

          {isNotificationsOpen && (
            <div className="admin-notifications-panel">
              <div className="admin-notifications-header">
                <h3>Notifications</h3>
                <div className="admin-notifications-actions">
                  {unreadCount > 0 && (
                    <button className="admin-btn admin-btn-text" onClick={markAllAsRead}>
                      <IonIcon icon={checkmarkOutline} />
                      <span>Marquer tout comme lu</span>
                    </button>
                  )}
                  <button className="admin-btn admin-btn-icon" onClick={toggleNotifications}>
                    <IonIcon icon={closeOutline} />
                  </button>
                </div>
              </div>

              <div className="admin-notifications-content">
                {notifications.length > 0 ? (
                  <div className="admin-notifications-list">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`admin-notification-item ${
                          !notification.read ? "admin-notification-unread" : ""
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="admin-notification-content">
                          <div className="admin-notification-title">
                            <span>{notification.title}</span>
                            {!notification.read && <span className="admin-notification-indicator"></span>}
                          </div>
                          <p className="admin-notification-message">{notification.message}</p>
                          <span className="admin-notification-time">{notification.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="admin-notifications-empty">
                    <p>Aucune notification</p>
                  </div>
                )}
              </div>

              <div className="admin-notifications-footer">
                <button className="admin-btn admin-btn-outline">Voir toutes les notifications</button>
              </div>
            </div>
          )}
        </div>

        <div className="admin-profile">
          <div className="admin-profile-avatar">
            <span>{adminName.charAt(0).toUpperCase()}</span>
          </div>
          <span className="admin-profile-name">{adminName}</span>
        </div>
      </div>
    </div>
  );
};

export default AdminPageHeader;
