'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Code, Search, Filter } from 'lucide-react';

// The Simulation interface from your Directus instance
interface Simulation {
  id: string;
  title: string;
  description: string;
  // This field contains the full HTML of the simulation
  code: string; 
  // The following are likely null or empty if you stored everything in code
  html_code?: string; 
  css_code?: string;
}

// Enhanced SimulationRenderer component
function SimulationRenderer({ simulation }: { simulation: Simulation }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!simulation || !iframeRef.current) return;

    setError(null);
    const iframe = iframeRef.current;

    try {
      // The content to be rendered is the full HTML document
      // stored in the code field.
      const simulationHTML = simulation.code;

      if (!simulationHTML) {
        throw new Error("Simulation content (code) is empty.");
      }

      const doc = iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(simulationHTML);
        doc.close();
      } else {
        // Fallback for some browsers
        iframe.srcdoc = simulationHTML;
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error loading simulation');
      console.error("Simulation Rendering Error:", err);
    }

  }, [simulation]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-medium">Error loading simulation:</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  // Use a ref on the iframe directly
  return (
    <iframe
      ref={iframeRef}
      title={simulation.title}
      style={{
        width: '100%',
        height: '450px', // Increased height for better viewing
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: 'white',
      }}
      sandbox="allow-scripts allow-same-origin"
      className="simulation-iframe"
    ></iframe>
  );
}


export default function SimulationsPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [filteredSimulations, setFilteredSimulations] = useState<Simulation[]>([]);
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSimulations = async () => {
      try {
        // IMPORTANT: Replace with your actual Directus URL and Token
        const response = await fetch('http://34.10.248.60:8055/items/lms_simulations', {
          headers: {
            'Authorization': 'Bearer Z0tCZSdIl2Qbxr8E_e7MDClpgppai_-x'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch simulations (Status: ${response.status})`);
        }

        const data = await response.json();
        if (!data.data) {
            throw new Error("Fetched data is not in the expected format.");
        }

        setSimulations(data.data);
        setFilteredSimulations(data.data);
        // Automatically select the first simulation on load
        if (data.data.length > 0) {
            setSelectedSimulation(data.data[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSimulations();
  }, []);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = simulations.filter(simulation =>
      simulation.title.toLowerCase().includes(lowercasedFilter) ||
      simulation.description?.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredSimulations(filtered);
  }, [searchTerm, simulations]);

  const selectSimulation = (simulation: Simulation) => {
    setSelectedSimulation(simulation);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading simulations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Fetch Error</h2>
          <p className="text-red-700 bg-red-50 p-4 rounded-md">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Interactive Simulations</h1>
                <p className="text-gray-600 mt-1">Explore and interact with our collection of learning simulations</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {filteredSimulations.length} simulation{filteredSimulations.length !== 1 ? 's' : ''} available
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-80 lg:w-96 bg-white rounded-lg shadow-sm border h-fit flex-shrink-0">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search simulations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Simulations List */}
            <div className="p-2 max-h-[60vh] md:max-h-96 overflow-y-auto">
              {filteredSimulations.map((simulation) => (
                <button
                  key={simulation.id}
                  onClick={() => selectSimulation(simulation)}
                  className={`w-full p-3 text-left rounded-lg transition-colors mb-1 ${
                    selectedSimulation?.id === simulation.id
                      ? 'bg-purple-50 ring-2 ring-purple-200'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium text-sm mb-1 truncate ${
                        selectedSimulation?.id === simulation.id ? 'text-purple-700' : 'text-gray-900'
                      }`}>
                        {simulation.title}
                      </h3>
                      {simulation.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {simulation.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filteredSimulations.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                <Filter className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No simulations found</p>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {selectedSimulation ? (
              <div className="bg-white rounded-lg shadow-sm border">
                {/* Simulation Header */}
                <div className="p-6 border-b">
                  <div className="flex items-center gap-3 mb-3">
                    <Play className="w-6 h-6 text-purple-600" />
                    <h2 className="text-2xl font-bold text-gray-900">{selectedSimulation.title}</h2>
                  </div>
                  {selectedSimulation.description && (
                    <p className="text-gray-600">{selectedSimulation.description}</p>
                  )}
                </div>

                {/* Simulation Content */}
                <div className="p-4 md:p-6">
                    <SimulationRenderer simulation={selectedSimulation} />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Play className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-medium mb-2">Select a Simulation</h3>
                  <p>Choose a simulation from the sidebar to start exploring</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
