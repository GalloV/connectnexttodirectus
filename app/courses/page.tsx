'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Layers, GraduationCap, Play, Code } from 'lucide-react';

interface Simulation {
  id: string;
  title: string;
  description: string;
  html_code: string;
  css_code: string;
  js_code2: string;
}

interface LessonSimulationJunction {
  id: string;
  lms_lessons_id: string;
  lms_simulations_id: Simulation;
}

interface Lesson {
  id: string;
  title: string;
  slug: string;
  video_url: string;
  video_duration: string;
  video_transcript: string;
  content: string;
  live_preview: string;
  lms_simulations: LessonSimulationJunction[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
  status: string;
  description: string;
  description_long: string;
  modules: Module[];
}

// Enhanced SimulationRenderer component
function SimulationRenderer({ simulation }: { simulation: Simulation }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    if (!containerRef.current || !simulation) return;

    setError(null);

    try {
      // Clear previous content
      containerRef.current.innerHTML = '';

      // Create an iframe for safer execution
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '400px';
      iframe.style.border = '1px solid #e5e7eb';
      iframe.style.borderRadius = '8px';
      iframe.sandbox = 'allow-scripts allow-same-origin';

      containerRef.current.appendChild(iframe);

      // Create the simulation content
      const simulationHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${simulation.title}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: system-ui, -apple-system, sans-serif;
            }
            ${simulation.css_code || ''}
          </style>
        </head>
        <body>
          ${simulation.html_code || ''}
          <script>
            try {
              ${simulation.js_code2 || ''}
            } catch (error) {
              console.error('Simulation error:', error);
              document.body.innerHTML += '<div style="color: red; padding: 10px; background: #fee; border: 1px solid #fcc; border-radius: 4px; margin-top: 10px;">Error in simulation: ' + error.message + '</div>';
            }
          </script>
        </body>
        </html>
      `;

      // Write content to iframe
      iframe.onload = () => {
        if (iframe.contentDocument) {
          iframe.contentDocument.open();
          iframe.contentDocument.write(simulationHTML);
          iframe.contentDocument.close();
        }
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [simulation]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading simulation: {error}</p>
      </div>
    );
  }

  return <div ref={containerRef} className="simulation-container"></div>;
}

const sanitizeContent = (content: string) => {
  return content;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'lesson' | 'simulation'>('lesson');

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleLesson = (lessonId: string) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
    }
    setExpandedLessons(newExpanded);
  };

  const selectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setSelectedSimulation(null);
    setViewType('lesson');
  };

  const selectSimulation = (junctionData: LessonSimulationJunction) => {
    setSelectedSimulation(junctionData.lms_simulations_id);
    setSelectedLesson(null);
    setViewType('simulation');
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Updated query to properly fetch M2M relationship
        const response = await fetch('http://34.10.248.60:8055/items/lms_courses?fields=*,modules.*,modules.lessons.*,modules.lessons.simulations.id.*', {
          headers: {
            'Authorization': 'Bearer Z0tCZSdIl2Qbxr8E_e7MDClpgppai_-x'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }

        const data = await response.json();
        setCourses(data.data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Courses
          </h1>
        </div>
        <div className="p-2">
          {courses.map((course) => (
            <div key={course.id} className="mb-2">
              <button
                onClick={() => toggleCourse(course.id)}
                className="w-full p-3 flex items-center gap-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
              >
                <GraduationCap className="w-5 h-5 text-blue-600 flex-shrink-0" />
                {expandedCourses.has(course.id) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
                <span className="font-medium text-left">{course.title}</span>
              </button>
              
              {expandedCourses.has(course.id) && (
                <div className="ml-9 mt-1 space-y-1">
                  {course.modules?.map((module) => (
                    <div key={module.id}>
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full p-2 flex items-center gap-2 rounded-md hover:bg-gray-50 transition-colors text-gray-600"
                      >
                        <Layers className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        {expandedModules.has(module.id) ? (
                          <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="text-sm text-left">{module.title}</span>
                      </button>
                      
                      {expandedModules.has(module.id) && (
                        <div className="ml-8 mt-1 space-y-1">
                          {module.lessons?.map((lesson) => (
                            <div key={lesson.id}>
                              {/* Lesson Button */}
                              <button
                                onClick={() => lesson.lms_simulations?.length > 0 ? toggleLesson(lesson.id) : selectLesson(lesson)}
                                className={`w-full p-2 text-sm text-left rounded-md transition-colors hover:bg-blue-50 flex items-center gap-2
                                  ${selectedLesson?.id === lesson.id && viewType === 'lesson'
                                    ? 'bg-blue-50 text-blue-700 font-medium' 
                                    : 'text-gray-600 hover:text-blue-600'}`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                  selectedLesson?.id === lesson.id && viewType === 'lesson'
                                    ? 'bg-blue-600' 
                                    : 'bg-gray-400'
                                }`} />
                                {lesson.lms_simulations?.length > 0 && (
                                  expandedLessons.has(lesson.id) ? (
                                    <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  )
                                )}
                                <span className="flex-1">{lesson.title}</span>
                                {lesson.lms_simulations?.length > 0 && (
                                  <div className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                                    {lesson.lms_simulations.length}
                                  </div>
                                )}
                              </button>

                              {/* Simulations */}
                              {lesson.lms_simulations?.length > 0 && expandedLessons.has(lesson.id) && (
                                <div className="ml-6 mt-1 space-y-1">
                                  {/* Lesson Content Option */}
                                  <button
                                    onClick={() => selectLesson(lesson)}
                                    className={`w-full p-2 text-xs text-left rounded-md transition-colors hover:bg-blue-50 flex items-center gap-2
                                      ${selectedLesson?.id === lesson.id && viewType === 'lesson'
                                        ? 'bg-blue-50 text-blue-700 font-medium' 
                                        : 'text-gray-500 hover:text-blue-600'}`}
                                  >
                                    <BookOpen className="w-3 h-3 flex-shrink-0" />
                                    Lesson Content
                                  </button>
                                  
                                  {/* Simulations */}
                                  {lesson.lms_simulations.map((junctionData) => (
                                    <button
                                      key={junctionData.id}
                                      onClick={() => selectSimulation(junctionData)}
                                      className={`w-full p-2 text-xs text-left rounded-md transition-colors hover:bg-purple-50 flex items-center gap-2
                                        ${selectedSimulation?.id === junctionData.lms_simulations_id?.id && viewType === 'simulation'
                                          ? 'bg-purple-50 text-purple-700 font-medium' 
                                          : 'text-gray-500 hover:text-purple-600'}`}
                                    >
                                      <Play className="w-3 h-3 flex-shrink-0" />
                                      {junctionData.lms_simulations_id?.title || 'Simulation'}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-white">
        {viewType === 'lesson' && selectedLesson ? (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{selectedLesson.title}</h2>
            {selectedLesson.video_url && (
              <div className="mb-6">
                <div className="aspect-video bg-gray-100 rounded-lg mb-2">
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    Video Player: {selectedLesson.video_url}
                  </div>
                </div>
                {selectedLesson.video_duration && (
                  <p className="text-sm text-gray-600">Duration: {selectedLesson.video_duration}</p>
                )}
              </div>
            )}
            {selectedLesson.content && (
              <div 
                className="prose prose-gray max-w-none text-gray-700 [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800 [&_.btn]:inline-block [&_.btn]:bg-blue-600 [&_.btn]:text-white [&_.btn]:px-4 [&_.btn]:py-2 [&_.btn]:rounded-md [&_.btn]:no-underline [&_.btn:hover]:bg-blue-700 [&_strong]:text-gray-900 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-800 [&_p]:mb-4 [&_br]:mb-2"
                dangerouslySetInnerHTML={{
                  __html: sanitizeContent(selectedLesson.content)
                }}
              />
            )}
            {selectedLesson.video_transcript && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Transcript</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
                  {selectedLesson.video_transcript}
                </div>
              </div>
            )}
          </div>
        ) : viewType === 'simulation' && selectedSimulation ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-800">{selectedSimulation.title}</h2>
            </div>
            {selectedSimulation.description && (
              <p className="text-gray-600 mb-6">{selectedSimulation.description}</p>
            )}
            <div className="bg-gray-50 p-4 rounded-lg">
              <SimulationRenderer simulation={selectedSimulation} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <BookOpen className="w-16 h-16 mb-4" />
            <p className="text-xl">Select a lesson or simulation to start learning</p>
          </div>
        )}
      </div>
    </div>
  );
}