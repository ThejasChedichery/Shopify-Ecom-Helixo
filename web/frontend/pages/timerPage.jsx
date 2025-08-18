import { useState, useEffect } from "react";
import toast, { toastConfig } from 'react-simple-toasts';
import "../style.css"; 
toastConfig({ theme: 'dark' });

export default function TimerPage() {
  const [timers, setTimers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [editingTimer, setEditingTimer] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    timerName: "",
    startDate: "",
    startTime: "00:00", // Set default time
    endDate: "",
    endTime: "23:59", // Set default time
    description: "",
    color: "#ff0000",
    size: "medium",
    position: "top",
    urgencyNotification: "color_pulse"
  });

  const SHOP_DOMAIN = "helixo-machine-test.myshopify.com";

  const sizeOptions = [
    { label: "Small", value: "small" },
    { label: "Medium", value: "medium" },
    { label: "Large", value: "large" }
  ];

  const positionOptions = [
    { label: "Top", value: "top" },
    { label: "Bottom", value: "bottom" },
    { label: "Floating", value: "floating" }
  ];

  const urgencyOptions = [
    { label: "Color pulse", value: "color_pulse" },
    { label: "Banner notification", value: "banner_notification" },
    { label: "Blinking effect", value: "blinking_effect" }
  ];

  // Fetch timers on component mount
  useEffect(() => {
    fetchTimers();
  }, []);

  const fetchTimers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/timers?shopDomain=${SHOP_DOMAIN}`);
      const data = await response.json();
      if (data.success) {
        setTimers(data.timers || []);
      }
    } catch (err) {
      console.error("Failed to fetch timers", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTimer = async () => {
    if (!formData.timerName || !formData.startDate || !formData.endDate) {
        toast("Please fill in all required fields");
      return;
    }

    // Create proper local datetime strings (without Z to avoid UTC conversion)
    const startDateTime = `${formData.startDate}T${formData.startTime}:00`;
    const endDateTime = `${formData.endDate}T${formData.endTime}:00`;

    // Create Date objects in local timezone
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    // Check if end date is after start date
    if (endDate <= startDate) {
      toast("End date and time must be after start date and time");
      return;
    }

    const payload = {
      shopDomain: SHOP_DOMAIN,
      startDate: startDate.toISOString(), // Convert to ISO after creating in local timezone
      endDate: endDate.toISOString(), // Convert to ISO after creating in local timezone
      description: formData.description || formData.timerName, // Use timer name as fallback for description
      displayOptions: {
        color: formData.color,
        position: formData.position,
        size: formData.size
      },
      urgencySettings: {
        enableBanner: formData.urgencyNotification
        // warningTimeMinutes removed as per your request
      }
    };

    try {
      setLoading(true);
      const url = editingTimer ? `/api/timers/${editingTimer._id}` : '/api/timers';
      const method = editingTimer ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast(editingTimer ? "Timer updated successfully!" : "Timer created successfully!");
        setModalActive(false);
        resetForm();
        fetchTimers();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save timer');
      }
    } catch (err) {
      console.error("Failed to save timer", err);
      toast("Error saving timer: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimer = async (timerId) => {
    if (!confirm("Are you sure you want to delete this timer?")) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/timers/${timerId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast("Timer deleted successfully!");
        fetchTimers();
      } else {
        throw new Error('Failed to delete timer');
      }
    } catch (err) {
      console.error("Failed to delete timer", err);
      toast("Error deleting timer");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTimer = (timer) => {
    setEditingTimer(timer);
    
    // Create date objects and convert to local timezone for editing
    const startDate = new Date(timer.startDate);
    const endDate = new Date(timer.endDate);
    
    // Format dates in local timezone
    const startDateStr = startDate.getFullYear() + '-' + 
                        String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(startDate.getDate()).padStart(2, '0');
    const startTimeStr = String(startDate.getHours()).padStart(2, '0') + ':' + 
                        String(startDate.getMinutes()).padStart(2, '0');
    
    const endDateStr = endDate.getFullYear() + '-' + 
                      String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(endDate.getDate()).padStart(2, '0');
    const endTimeStr = String(endDate.getHours()).padStart(2, '0') + ':' + 
                      String(endDate.getMinutes()).padStart(2, '0');
    
    setFormData({
      timerName: timer.description || "Timer", // Use description as timer name
      startDate: startDateStr,
      startTime: startTimeStr,
      endDate: endDateStr,
      endTime: endTimeStr,
      description: timer.description || "",
      color: timer.displayOptions?.color || "#ff0000",
      size: timer.displayOptions?.size || "medium",
      position: timer.displayOptions?.position || "top",
      urgencyNotification: timer.urgencySettings?.enableBanner || "color_pulse"
    });
    setModalActive(true);
  };

  const resetForm = () => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].slice(0, 5);
    
    setFormData({
      timerName: "",
      startDate: currentDate, // Set to current date by default
      startTime: currentTime, // Set to current time by default
      endDate: currentDate,
      endTime: "23:59",
      description: "",
      color: "#ff0000",
      size: "medium",
      position: "top",
      urgencyNotification: "color_pulse"
    });
    setEditingTimer(null);
  };

  const getTimerStatus = (timer) => {
    const now = new Date();
    const start = new Date(timer.startDate);
    const end = new Date(timer.endDate);

    if (now < start) return { status: "Scheduled", color: "#3b82f6" };
    if (now > end) return { status: "Expired", color: "#ef4444" };
    return { status: "Active", color: "#10b981" };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const filteredTimers = timers.filter(timer => 
    (timer.description || "").toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="timer-container">
      {/* Header */}
      <div className="timer-header">
        <div className="timer-header-top">
          <div>
            <h1 className="timer-title">Countdown Timer Manager</h1>
            <p className="timer-subtitle">Create and manage countdown timers for your promotions</p>
          </div>
          <button
            className="create-button"
            onClick={() => {
              resetForm();
              setModalActive(true);
            }}
          >
            <span style={{fontSize: '18px'}}>+</span>
            Create timer
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="timer-card">
        {/* Search */}
        <div className="search-container">
          <div style={{position: 'relative'}}>
            <input
              type="text"
              placeholder="Search timers"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="search-input"
            />
            {searchValue && (
              <button
                onClick={() => setSearchValue("")}
                className="search-clear"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Loading timers...</p>
          </div>
        ) : filteredTimers.length > 0 ? (
          <div className="table-container">
            <table className="timer-table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Timer Name</th>
                  <th className="table-header-cell">Description</th>
                  <th className="table-header-cell">Start Date</th>
                  <th className="table-header-cell">End Date</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTimers.map((timer) => {
                  const { status, color } = getTimerStatus(timer);
                  return (
                    <tr key={timer._id} className="table-row">
                      <td className="table-cell">
                        <div className="table-cell-name">
                          {timer.description?.substring(0, 30) + (timer.description?.length > 30 ? "..." : "") || "Untitled Timer"}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="table-cell-description">
                          {timer.description || "-"}
                        </div>
                      </td>
                      <td className="table-cell">
                        {formatDate(timer.startDate)}
                      </td>
                      <td className="table-cell">
                        {formatDate(timer.endDate)}
                      </td>
                      <td className="table-cell">
                        <span 
                          className="status-badge"
                          style={{
                            backgroundColor: color + '20',
                            color: color
                          }}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEditTimer(timer)}
                            className="action-button edit-button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTimer(timer._id)}
                            className="action-button delete-button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">⏰</div>
            <h3 className="empty-title">No timers found</h3>
            <p className="empty-text">Create your first countdown timer to get started</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalActive && (
        <div className="modal-overlay">
          <div className="modal-content">
            {/* Modal Header */}
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTimer ? "Edit Timer" : "Create New Timer"}
              </h3>
              <button
                className="close-button"
                onClick={() => {
                  setModalActive(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div>
              {/* Timer Name */}
              <div className="form-group">
                <label className="form-label">
                  Timer name *
                </label>
                <input
                  type="text"
                  value={formData.timerName}
                  onChange={(e) => setFormData({...formData, timerName: e.target.value})}
                  placeholder="Enter timer name"
                  className="form-input"
                />
              </div>

              {/* Start Date and Time */}
              <div className="form-row">
                <div>
                  <label className="form-label">
                    Start date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Start time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>

              {/* End Date and Time */}
              <div className="form-row">
                <div>
                  <label className="form-label">
                    End date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">
                    End time *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">
                  Promotion description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter promotion details (optional - timer name will be used if empty)"
                  className="form-textarea"
                />
              </div>

              {/* Color Picker */}
              <div className="form-group">
                <label className="form-label">
                  Timer Color
                </label>
                <div className="color-picker-container">
                  <div 
                    className="color-preview"
                    style={{ backgroundColor: formData.color }}
                  />
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="color-input"
                  />
                </div>
              </div>

              {/* Size and Position */}
              <div className="form-row">
                <div>
                  <label className="form-label">
                    Timer size
                  </label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value})}
                    className="form-select"
                  >
                    {sizeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">
                    Timer position
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="form-select"
                  >
                    {positionOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Urgency Notification */}
              <div className="form-group">
                <label className="form-label">
                  Urgency notification
                </label>
                <select
                  value={formData.urgencyNotification}
                  onChange={(e) => setFormData({...formData, urgencyNotification: e.target.value})}
                  className="form-select"
                >
                  {urgencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => {
                  setModalActive(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTimer}
                disabled={loading}
                className="save-button"
              >
                {loading ? "Saving..." : (editingTimer ? "Update timer" : "Create timer")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}