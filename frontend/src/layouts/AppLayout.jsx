import React from 'react';
import { NavLink } from 'react-router-dom';

const AppLayout = ({ children }) => {
  return (
<div>
      {children}
      <nav>
        <ul>
          <li>
            <NavLink to="/">Home</NavLink>
          </li>
          <li>
            <NavLink to="/login">Login</NavLink>
          </li>
          <li>
            <NavLink to="/hackathons">Hackathons</NavLink>
          </li>
          <li>
            <NavLink to="/teams">Teams</NavLink>
          </li>
          <li>
            <NavLink to="/users">Users</NavLink>
          </li>
          <li>
            <NavLink to="/requests">Requests</NavLink>
          </li>
          <li>
            <NavLink to="/profile">Profile</NavLink>
          </li>
          <li>
            <NavLink to="/recommendations">Recommendations</NavLink>
          </li>
          <li>
            <NavLink to="/hackmate">HackMate</NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default AppLayout;
