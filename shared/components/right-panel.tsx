import { useNotification } from '../context/notification';

const RightPanel = () => {
  const { notifications } = useNotification();

  return (
    <div className="RightPanel">
      <h2>Notifications</h2>
      <ul>
        {notifications.map((notification) => (
          <li key={notification.id}>
            {notification.message} - {new Date(notification.timestamp).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RightPanel;
