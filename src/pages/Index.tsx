import { useState } from "react";
import { Dashboard } from "./Dashboard";
import { AddService } from "./AddService";
import { Analytics } from "./Analytics";
import { UpcomingServices } from "./UpcomingServices";
import { BottomNav } from "@/components/BottomNav";

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'upcoming':
        return <UpcomingServices />;
      case 'add':
        return <AddService />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderContent()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
