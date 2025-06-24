// src/components/shared/schedule/NotificationsPanel.jsx

const NotificationPanel = () => {
  // Sample notification data - in real app this would come from props or API
  const notifications = [];

  return (
    <div className="rounded-md border border-zinc-500 bg-white p-3.5">
      <div className="space-y-2.5">
        {/* Header */}
        <header className="flex items-center gap-4 px-5 py-3">
          <div className="w-[30px] h-[30px] bg-[#488BBE] rounded flex items-center justify-center">
            <span className="material-icons text-white text-lg">notifications</span>
          </div>
          <h2 className="text-xl font-semibold text-blue-500">Notifikasi</h2>
        </header>

        {/* Notification Content */}
        <div className="min-h-[150px] flex items-center justify-center">
          {notifications.length === 0 ? (
            <p className="text-xs text-zinc-500">Belum ada notifikasi</p>
          ) : (
            <div className="w-full space-y-3 max-h-[200px] overflow-y-auto scrollbar-custom">
              {notifications.map((notification, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-neutral-700 mb-1">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-neutral-600 mb-2">
                        {notification.message}
                      </p>
                      <span className="text-xs text-neutral-500">
                        {notification.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
