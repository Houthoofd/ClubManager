import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Enregistrement des modules nécessaires pour Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Définition des props
interface PresenceChartProps {
  title: string;
  data: Record<string, number>; // { "Jan": 3, "Fév": 5, ... }
}

const PresenceChart: React.FC<PresenceChartProps> = ({ title, data }) => {
  // Labels des mois
  const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  // Construire le tableau des valeurs à partir de l'objet `data`
  const monthlyPresence = labels.map((month) => data[month] || 0);

  // Données pour Chart.js
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Présences',
        data: monthlyPresence,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }
    ]
  };

  // Options du graphique
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 } // Évite les valeurs décimales
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export default PresenceChart;
