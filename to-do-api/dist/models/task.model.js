"use strict";
/**
 * Task model interface and related types
 * @fileoverview Defines the Task entity structure and related types
 * @see docs/prd.md section 5.3
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStatus = exports.TaskPriority = void 0;
/**
 * Priority levels for tasks
 */
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "low";
    TaskPriority["MEDIUM"] = "medium";
    TaskPriority["HIGH"] = "high";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
/**
 * Task status for filtering
 */
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["PENDING"] = "pending";
    TaskStatus["OVERDUE"] = "overdue";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
