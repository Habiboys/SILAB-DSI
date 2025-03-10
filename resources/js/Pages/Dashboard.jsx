import React from 'react';
import DashboardLayout from '../Layouts/DashboardLayout';

const App = () => {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div>Content for this card goes here</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Statistics</h2>
          <div>Content for this card goes here</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          <div>Content for this card goes here</div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default App;