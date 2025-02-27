import { useState, useEffect } from 'react';
import { useNotification } from '../context/notification';

const TaskManager = () => {
  const [tasks, setTasks] = useState<{ id: number; text: string; completed: boolean; isEditing: boolean; isComplete: boolean }[]>([]);
  const [newTask, setNewTask] = useState('');

  // Notification state
  const { addNotification, handleDeleteTask: notifyDeleteTask, notifications } = useNotification(); // Renamed 'handleDeleteTask' to 'notifyDeleteTask'

  const handleAddTask = (e: any) => {
    e.preventDefault();
    if (newTask.trim()) {
      const newTaskObj = {
        id: Date.now(), // Génération d'un ID unique pour chaque tâche
        text: newTask,
        completed: false,
        isEditing: false,
        isComplete: false
      };
      setTasks([...tasks, newTaskObj]);
      setNewTask('');
      addNotification(`Tâche ajoutée : ${newTask}`, newTaskObj.id.toString()); // Notification liée à l'ID de la tâche
    }
  };

  const handleCompleteTask = (index: number) => {
    const updatedTasks = tasks.map((task, i) =>
      i === index ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    addNotification("État de la tâche modifié", tasks[index].id.toString());
  };

  const handleTaskDelete = (index: number) => {
    const taskId = tasks[index].id; // Récupération de l'ID de la tâche
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);

    // Supprimer la notification associée
    notifyDeleteTask(taskId.toString()); // Call the 'handleDeleteTask' from 'useNotification'
  };

  const handleDeCompleteTask = (index: number) => {
    const updatedTasks = tasks.map((task, i) =>
      i === index ? { ...task, completed: false } : task
    );
    setTasks(updatedTasks);
    addNotification("Tâche incomplètée", tasks[index].id.toString());
  };

  const handleSaveTask = (index: number, newText: string) => {
    const updatedTasks = tasks.map((task, i) =>
      i === index ? { ...task, text: newText, isEditing: false } : task
    );
    setTasks(updatedTasks);
    addNotification("Tâche modifiée", tasks[index].id.toString());
  };

  const handleEditTask = (index: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task, i) =>
        i === index ? { ...task, isEditing: true } : task
      )
    );
  };

  useEffect(() => {
    console.log('Tâches mises à jour:', tasks);
  }, [tasks]);

  return (
    <div className="TaskManager bg-gray-100 p-6 rounded-lg shadow-md max-w-lg mx-auto">
      <h1 className="TaskManager-title text-2xl font-bold mb-4">Gestionnaire de tâches</h1>
  
      <form className="TaskManager-formulaire flex items-center space-x-4 mb-4">
        <input
          type="text"
          placeholder="Nouvelle tâche"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddTask}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
        >
          Ajouter
        </button>
      </form>

      <ul className="space-y-2">
        {tasks.map((task, index) => (
          <li
            key={index}
            className={`p-4 rounded-md shadow-md flex justify-between items-center ${task.completed ? 'bg-green-500' : 'bg-white'}`}
          >
            <span className={task.completed ? 'text-white' : 'text-black'}>
              {task.isEditing ? (
                <input
                  type="text"
                  value={task.text}
                  onChange={(e) => {
                    const updatedTasks = [...tasks];
                    updatedTasks[index].text = e.target.value;
                    setTasks(updatedTasks);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                task.text
              )}
            </span>

            <div className="flex space-x-3 items-center">
              {task.isEditing ? (
                <svg 
                  onClick={() => handleSaveTask(index, task.text)} // Enregistrer les modifications
                  xmlns="http://www.w3.org/2000/svg" 
                  height="24px" 
                  viewBox="0 -960 960 960" 
                  width="24px" 
                  fill="#5f6368"
                >
                  <path 
                    d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM480-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM240-560h360v-160H240v160Zm-40-86v446-560 114Z"
                  />
                </svg>
              ) : (
                <svg 
                  onClick={() => handleEditTask(index)} // Passer en mode édition
                  xmlns="http://www.w3.org/2000/svg" 
                  height="24px" 
                  viewBox="0 -960 960 960" 
                  width="24px" 
                  fill="#5f6368"
                >
                  <path 
                    d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"
                  />
                </svg>
              )}
              <svg 
                onClick={() => handleTaskDelete(index)} // Renamed to 'handleTaskDelete'
                xmlns="http://www.w3.org/2000/svg" 
                height="24px" 
                viewBox="0 -960 960 960" 
                width="24px" 
                fill="#5f6368"
              >
                <path 
                  d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
                />
              </svg>
              {task.completed ? (
                <svg 
                  onClick={() => handleDeCompleteTask(index)}
                  xmlns="http://www.w3.org/2000/svg" 
                  height="24px" 
                  viewBox="0 -960 960 960" 
                  width="24px" 
                  fill="#5f6368"
                >
                  <path 
                    d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"
                  />
                </svg>
              ) : (
                <svg
                  onClick={() => handleCompleteTask(index)}  
                  xmlns="http://www.w3.org/2000/svg" 
                  height="24px" 
                  viewBox="0 -960 960 960" 
                  width="24px" 
                  fill="#5f6368"
                >
                  <path 
                    d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"
                  />
                </svg>
              )}
            </div>

          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskManager;
