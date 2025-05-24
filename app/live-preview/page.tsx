'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Layers, GraduationCap, Search } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  slug: string;
  video_url: string;
  video_duration: string;
  video_transcript: string;
  content: string;
  live_preview: boolean;
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

const sanitizeContent = (content: string) => {
  return content;
};

export default function LivePreviewPage() {
  const [searchTitle, setSearchTitle] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourse, setFilteredCourse] = useState<Course | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all courses on component mount
  useEffect(() => {
    const fetchAllCourses = async () => {
      try {
        const response = await fetch('https://lms.tecktal.ai/items/lms_courses', {
          headers: {
            'Authorization': 'Bearer gE-Rd6oO2pbkolA8keNtihRnBs7qbU7m'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }

        const data = await response.json();
        setCourses(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred loading courses');
      }
    };

    fetchAllCourses();
  }, []);

  // Function to find which module contains a lesson
  const findModuleForLesson = (lesson: Lesson): string | null => {
    if (!filteredCourse) return null;
    
    for (const module of filteredCourse.modules || []) {
      if (module.lessons?.some(l => l.id === lesson.id)) {
        return module.id;
      }
    }
    return null;
  };

  // Update expandedModules when a lesson is selected
  useEffect(() => {
    if (selectedLesson) {
      const moduleId = findModuleForLesson(selectedLesson);
      if (moduleId) {
        setExpandedModules(prev => {
          const newSet = new Set(prev);
          newSet.add(moduleId);
          return newSet;
        });
      }
    }
  }, [selectedLesson]);

  // When a new course is loaded, expand its first module with a live preview lesson
  useEffect(() => {
    if (filteredCourse) {
      for (const module of filteredCourse.modules || []) {
        if (module.lessons?.some(lesson => lesson.live_preview)) {
          setExpandedModules(prev => {
            const newSet = new Set(prev);
            newSet.add(module.id);
            return newSet;
          });
          break;
        }
      }
    }
  }, [filteredCourse]);

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const findFirstLivePreviewLesson = (course: Course): Lesson | null => {
    for (const module of course.modules || []) {
      for (const lesson of module.lessons || []) {
        if (lesson.live_preview) {
          return lesson;
        }
      }
    }
    return null;
  };

  const fetchCourseDetails = async (courseId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://lms.tecktal.ai/items/lms_courses/${courseId}?fields=*,modules.*,modules.lessons.*`, {
        headers: {
          'Authorization': 'Bearer gE-Rd6oO2pbkolA8keNtihRnBs7qbU7m'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch course details');
      }

      const data = await response.json();
      const courseData = data.data;
      setFilteredCourse(courseData);

      // Find and set the first live preview lesson
      const firstLivePreviewLesson = findFirstLivePreviewLesson(courseData);
      if (firstLivePreviewLesson) {
        setSelectedLesson(firstLivePreviewLesson);
      } else {
        setError('No live preview lessons found in this course');
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Clear the selected lesson and any error messages
    setSelectedLesson(null);
    setError(null);
    
    if (!searchTitle.trim()) {
      setError('Please enter a course title');
      return;
    }

    const foundCourse = courses.find(course => 
      course.title.toLowerCase().includes(searchTitle.toLowerCase())
    );

    if (!foundCourse) {
      setError('No course found with that title');
      // Also clear the filtered course when no match is found
      setFilteredCourse(null);
      return;
    }

    // Clear the expanded modules when starting a new search
    setExpandedModules(new Set());
    fetchCourseDetails(foundCourse.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    const moduleId = findModuleForLesson(lesson);
    if (moduleId) {
      setExpandedModules(prev => {
        const newSet = new Set(prev);
        newSet.add(moduleId);
        return newSet;
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2 text-gray-900 mb-4">
            <BookOpen className="w-5 h-5 text-blue-700" />
            Live Preview
          </h1>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter Course Title"
              className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Loading...' : <Search className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>
        <div className="p-2">
          {filteredCourse && (
            <div className="mb-2">
              <div className="p-3 flex items-center gap-2 text-gray-900">
                <GraduationCap className="w-5 h-5 text-blue-700 flex-shrink-0" />
                <span className="font-medium text-left">{filteredCourse.title}</span>
              </div>
              
              <div className="ml-9 mt-1 space-y-1">
                {filteredCourse.modules?.map((module) => (
                  <div key={module.id}>
                    <button
                      onClick={() => toggleModule(module.id)}
                      className={`w-full p-2 flex items-center gap-2 rounded-md transition-colors text-gray-800 ${
                        expandedModules.has(module.id) ? 'bg-gray-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-indigo-700 flex-shrink-0" />
                      {expandedModules.has(module.id) ? (
                        <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      )}
                      <span className="text-sm text-left">{module.title}</span>
                    </button>
                    
                    {expandedModules.has(module.id) && (
                      <div className="ml-8 mt-1 space-y-1">
                        {module.lessons?.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => handleLessonSelect(lesson)}
                            className={`w-full p-2 text-sm text-left rounded-md transition-colors hover:bg-blue-50 flex items-center gap-2
                              ${selectedLesson?.id === lesson.id 
                                ? 'bg-blue-50 text-blue-800 font-medium' 
                                : 'text-gray-700 hover:text-blue-700'}`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              selectedLesson?.id === lesson.id 
                                ? 'bg-blue-700' 
                                : lesson.live_preview ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            {lesson.title}
                            {lesson.live_preview && (
                              <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                Live
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-white">
        {selectedLesson ? (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">{selectedLesson.title}</h2>
            {selectedLesson.video_url && (
              <div className="mb-6">
                <div className="aspect-video bg-gray-100 rounded-lg mb-2">
                  {/* Video player would go here */}
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    Video Player: {selectedLesson.video_url}
                  </div>
                </div>
                {selectedLesson.video_duration && (
                  <p className="text-sm text-gray-700">Duration: {selectedLesson.video_duration}</p>
                )}
              </div>
            )}
            {selectedLesson.content && (
              <div 
                className="prose prose-gray max-w-none text-gray-900 [&_a]:text-blue-700 [&_a]:underline [&_a:hover]:text-blue-800 [&_.btn]:inline-block [&_.btn]:bg-blue-700 [&_.btn]:text-white [&_.btn]:px-4 [&_.btn]:py-2 [&_.btn]:rounded-md [&_.btn]:no-underline [&_.btn:hover]:bg-blue-800 [&_strong]:text-gray-900 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_p]:mb-4 [&_p]:text-gray-800 [&_br]:mb-2"
                dangerouslySetInnerHTML={{
                  __html: sanitizeContent(selectedLesson.content)
                }}
              />
            )}
            {selectedLesson.video_transcript && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Transcript</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-800">
                  {selectedLesson.video_transcript}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <BookOpen className="w-16 h-16 mb-4" />
            <p className="text-xl">Enter a course title and click search to view live preview content</p>
          </div>
        )}
      </div>
    </div>
  );
} 