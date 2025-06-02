// src/components/shared/dashboard/DashboardFilters.jsx
import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";

/**
 * Dashboard filters component for both school and company dashboards
 */
const DashboardFilters = ({
  type = "student",
  selectedFilter,
  setSelectedFilter,
  selectedGrade,
  setSelectedGrade,
  options = {},
  filterLabel = "Kelas",
}) => {
  // Determine which options to show based on type
  const filterOptions = type === "student" ? options.classrooms || [] : options.departments || [];
  const gradeOptions = options.grades || [];

  return (
    <div className="flex gap-2 items-center">
      {/* Filter label */}
      <p className="text-sm text-zinc-500 mr-1">
        {type === "student" 
          ? `Filter ${filterLabel}:` 
          : `Filter ${filterLabel}:`
        }
      </p>

      {/* Primary filter (Classroom or Department) */}
      <Menu as="div" className="relative">
        <Menu.Button className="flex gap-px items-center self-start whitespace-nowrap text-sm border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50 transition-colors">
          <p className="self-stretch my-auto">{selectedFilter}</p>
          <span className="material-icons text-sm">keyboard_arrow_down</span>
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
            {filterOptions.map((option) => (
              <Menu.Item key={option}>
                {({ active }) => (
                  <button
                    className={`${active ? "bg-blue-100 text-primary" : ""} ${
                      selectedFilter === option
                        ? "bg-primary-light text-primary-variant1 font-semibold"
                        : ""
                    } w-full text-left px-4 py-2 text-sm`}
                    onClick={() => setSelectedFilter(option)}
                  >
                    {option}
                  </button>
                )}
              </Menu.Item>
            ))}
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Grade filter (only for students) */}
      {type === "student" && (
        <Menu as="div" className="relative">
          <Menu.Button className="flex gap-px items-center self-start whitespace-nowrap text-sm border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50 transition-colors">
            <p className="self-stretch my-auto">{selectedGrade}</p>
            <span className="material-icons text-sm">keyboard_arrow_down</span>
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              {gradeOptions.map((grade) => (
                <Menu.Item key={grade}>
                  {({ active }) => (
                    <button
                      className={`${active ? "bg-blue-100 text-primary" : ""} ${
                        selectedGrade === grade
                          ? "bg-primary-light text-primary-variant1 font-semibold"
                          : ""
                      } w-full text-left px-4 py-2 text-sm`}
                      onClick={() => setSelectedGrade(grade)}
                    >
                      {grade}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </Menu>
      )}
    </div>
  );
};

export default DashboardFilters;