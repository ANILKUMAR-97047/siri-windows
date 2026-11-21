"use client";

import { useState } from "react";
import {
  Wrench,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  X,
  MapPin,
  User,
} from "lucide-react";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { toast } from "@/components/ui/ToastProvider";
import { CustomSelect } from "@/components/ui/Select";

interface MaintenanceTask {
  id: string;
  date: string;
  category: string;
  location: string;
  task: string;
  assignedTo: string;
  priority: "low" | "normal" | "high" | "emergency";
  status: "pending" | "in_progress" | "completed";
  cost: number;
}

const initialTasks: MaintenanceTask[] = [
  {
    id: "mnt-1",
    date: "19 Nov 2026",
    category: "Factory Machinery",
    location: "Tanuku Workshop - Unit 1",
    task: "Double-mitre profile cutting saw blade sharpening and calibration",
    assignedTo: "S. Rambabu",
    priority: "high",
    status: "in_progress",
    cost: 1500,
  },
  {
    id: "mnt-2",
    date: "18 Nov 2026",
    category: "Site Installation Service",
    location: "GVR Residency Site, Tanuku",
    task: "Window sash alignment check and roller lubrication for 4th-floor units",
    assignedTo: "M. Durga Prasad",
    priority: "normal",
    status: "completed",
    cost: 0,
  },
  {
    id: "mnt-3",
    date: "17 Nov 2026",
    category: "Factory Machinery",
    location: "Welding Section",
    task: "Single-head UPVC seamless welding temperature sensor inspection (245°C)",
    assignedTo: "P. Venkanna",
    priority: "normal",
    status: "completed",
    cost: 800,
  },
  {
    id: "mnt-4",
    date: "19 Nov 2026",
    category: "Showroom Maintenance",
    location: "Siri Windows Main Showroom",
    task: "Display sliding window track cleaning and LED spotlight replacement",
    assignedTo: "Ch. Srinivas",
    priority: "low",
    status: "pending",
    cost: 450,
  },
];

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>(initialTasks);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newTask, setNewTask] = useState<{
    category: string;
    location: string;
    task: string;
    assignedTo: string;
    priority: MaintenanceTask["priority"];
    cost: number;
  }>({
    category: "Factory Machinery",
    location: "Tanuku Workshop",
    task: "",
    assignedTo: "S. Rambabu",
    priority: "normal",
    cost: 0,
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.task) return;

    const created: MaintenanceTask = {
      id: `mnt-${tasks.length + 1}`,
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      category: newTask.category,
      location: newTask.location,
      task: newTask.task,
      assignedTo: newTask.assignedTo,
      priority: newTask.priority,
      status: "pending",
      cost: Number(newTask.cost),
    };

    setTasks([created, ...tasks]);
    setIsModalOpen(false);
    toast.success("Maintenance task logged successfully!", "Task Created");
    setNewTask({
      category: "Factory Machinery",
      location: "Tanuku Workshop",
      task: "",
      assignedTo: "S. Rambabu",
      priority: "normal",
      cost: 0,
    });
  };

  const updateTaskStatus = (id: string, status: MaintenanceTask["status"]) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
    toast.info(`Task status updated to ${status.replace("_", " ").toUpperCase()}`);
  };

  const filteredTasks = tasks.filter((t) =>
    filterStatus === "all" ? true : t.status === filterStatus
  );

  return (
    <PermissionGuard permission="maintenance">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" />
            Daily Maintenance & Workshop Equipment Logs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Log machinery servicing, site window alignment repairs, and tooling maintenance.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Log Maintenance Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {["all", "pending", "in_progress", "completed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
              filterStatus === tab
                ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {tab === "all" ? "All Tasks" : tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Tasks Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Date & Category</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">Task Description</th>
                <th className="py-3 px-4 font-semibold">Technician</th>
                <th className="py-3 px-4 font-semibold">Priority</th>
                <th className="py-3 px-4 font-semibold">Cost</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {t.category}
                    </div>
                    <div className="text-[11px] text-slate-400">{t.date}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {t.location}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs font-medium text-slate-800 dark:text-slate-200">
                    {t.task}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {t.assignedTo}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        t.priority === "high" || t.priority === "emergency"
                          ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {t.cost > 0 ? `₹${t.cost}` : "Free / Internal"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        t.status === "completed"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : t.status === "in_progress"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {t.status.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right min-w-[140px]">
                    <CustomSelect
                      value={t.status}
                      onChange={(val) =>
                        updateTaskStatus(t.id, val as MaintenanceTask["status"])
                      }
                      size="sm"
                      options={[
                        { value: "pending", label: "Pending" },
                        { value: "in_progress", label: "In Progress" },
                        { value: "completed", label: "Completed" },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                Log Maintenance Task
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <CustomSelect
                    value={newTask.category}
                    onChange={(val) => setNewTask({ ...newTask, category: val })}
                    size="sm"
                    options={[
                      { value: "Factory Machinery", label: "Factory Machinery" },
                      { value: "Site Installation Service", label: "Site Installation Service" },
                      { value: "Showroom Maintenance", label: "Showroom Maintenance" },
                      { value: "Transport Vehicle", label: "Transport Vehicle" },
                    ]}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newTask.location}
                    onChange={(e) => setNewTask({ ...newTask, location: e.target.value })}
                    placeholder="Tanuku Workshop"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Task Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newTask.task}
                  onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                  placeholder="Describe repair or maintenance requirement..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Assigned Technician
                  </label>
                  <CustomSelect
                    value={newTask.assignedTo}
                    onChange={(val) => setNewTask({ ...newTask, assignedTo: val })}
                    size="sm"
                    options={[
                      { value: "S. Rambabu", label: "S. Rambabu" },
                      { value: "K. Nageswara Rao", label: "K. Nageswara Rao" },
                      { value: "P. Venkanna", label: "P. Venkanna" },
                      { value: "M. Durga Prasad", label: "M. Durga Prasad" },
                    ]}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Priority
                  </label>
                  <CustomSelect
                    value={newTask.priority}
                    onChange={(val) =>
                      setNewTask({
                        ...newTask,
                        priority: val as MaintenanceTask["priority"],
                      })
                    }
                    size="sm"
                    options={[
                      { value: "low", label: "Low" },
                      { value: "normal", label: "Normal" },
                      { value: "high", label: "High" },
                      { value: "emergency", label: "Emergency" },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Estimated Repair Cost (₹)
                </label>
                <input
                  type="number"
                  value={newTask.cost}
                  onChange={(e) => setNewTask({ ...newTask, cost: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-sm"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </PermissionGuard>
  );
}
