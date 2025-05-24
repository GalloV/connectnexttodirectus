'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Layers, GraduationCap } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  slug: string;
  video_url: string;
  video_duration: string;
  video_transcript: string;
  content: string;
  live_preview: string;
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
  // You might want to add more sanitization logic here if needed
  return content;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const selectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('https://lms.tecktal.ai/items/lms_courses?fields=*,modules.*,modules.lessons.*', {
          headers: {
            'Authorization': 'Bearer gE-Rd6oO2pbkolA8keNtihRnBs7qbU7m'
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
                            <button
                              key={lesson.id}
                              onClick={() => selectLesson(lesson)}
                              className={`w-full p-2 text-sm text-left rounded-md transition-colors hover:bg-blue-50 flex items-center gap-2
                                ${selectedLesson?.id === lesson.id 
                                  ? 'bg-blue-50 text-blue-700 font-medium' 
                                  : 'text-gray-600 hover:text-blue-600'}`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                selectedLesson?.id === lesson.id 
                                  ? 'bg-blue-600' 
                                  : 'bg-gray-400'
                              }`} />
                              {lesson.title}
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
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-white">
        {selectedLesson ? (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{selectedLesson.title}</h2>
            {selectedLesson.video_url && (
              <div className="mb-6">
                <div className="aspect-video bg-gray-100 rounded-lg mb-2">
                  {/* Video player would go here */}
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
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <BookOpen className="w-16 h-16 mb-4" />
            <p className="text-xl">Select a lesson to start learning</p>
          </div>
        )}
      </div>
    </div>
  );
} 