import React from 'react';
import { Link } from 'react-router-dom';

const AppLayout = ({ children }) => {
  return (
    <div>
      <nav>
        <ul>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/hackathons">Hackathons</Link></li>
          <li><Link to="/teams">Teams</Link></li>
          <li><Link to="/users">Users</Link></li>
          <li><Link to="/requests">Requests</Link></li>
          <li><Link to="/profile">Profile</Link></li>
          <li><Link to="/recommendations">Recommendations</Link></li>
        </ul>
      </nav>
      <main>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
