import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global.css';

import Splash from './screens/Splash';
import Scanning from './screens/Scanning';
import WifiSetup from './screens/WifiSetup';
import IpEntry from './screens/IpEntry';
import Home from './screens/Home';
import MaxBot from './screens/MaxBot';
import CarMode from './screens/CarMode';
import FollowMode from './screens/FollowMode';
import MaxDesk from './screens/MaxDesk';
import ShowCase from './screens/ShowCase';
import AIAssistant from './screens/AIAssistant';
import DataStore from './screens/DataStore';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/scanning" element={<Scanning />} />
        <Route path="/wifi-setup" element={<WifiSetup />} />
        <Route path="/ip-entry" element={<IpEntry />} />
        <Route path="/home" element={<Home />} />
        <Route path="/maxbot" element={<MaxBot />} />
        <Route path="/maxbot/car" element={<CarMode />} />
        <Route path="/maxbot/follow" element={<FollowMode />} />
        <Route path="/maxdesk" element={<MaxDesk />} />
        <Route path="/maxdesk/showcase" element={<ShowCase />} />
        <Route path="/maxdesk/ai" element={<AIAssistant />} />
        <Route path="/datastore" element={<DataStore />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
