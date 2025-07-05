/**
 * Lists API Controller
 * @fileoverview REST API endpoints for lists management
 */

import { Response, NextFunction } from 'express';
import { ListsService, DeleteListOptions } from '../../services/lists.service';
import { CreateListInput, UpdateListInput } from '../../models/list.model';
import { AuthRequest } from '../../middleware/auth.middleware';

/**
 * Controller class for handling lists API endpoints
 * Handles HTTP requests and responses for list operations
 */
export class ListsController {
  constructor(private listsService: ListsService) {}

  /**
   * GET /api/lists
   * Get all lists for the authenticated user
   * @param req - Express request object with user authentication
   * @param res - Express response object
   * @param next - Express next function
   */
  async getLists(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      const lists = await this.listsService.getUserLists(userId);

      res.status(200).json({
        success: true,
        data: lists,
        message: `Retrieved ${lists.length} lists`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/lists/:id
   * Get a specific list by ID
   * @param req - Express request object with user authentication
   * @param res - Express response object
   * @param next - Express next function
   */
  async getListById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      const listId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      if (!listId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'List ID is required'
          }
        });
        return;
      }

      const list = await this.listsService.getListById(listId, userId);

      if (!list) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'List not found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: list,
        message: 'List retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/lists
   * Create a new list
   * @param req - Express request object with user authentication
   * @param res - Express response object
   * @param next - Express next function
   */
  async createList(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      const { name, description } = req.body;

      // Validate required fields
      if (!name || !name.trim()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'List name is required'
          }
        });
        return;
      }

      const listData: CreateListInput = {
        userId,
        name: name.trim(),
        description: description?.trim()
      };

      const createdList = await this.listsService.createList(listData);

      res.status(201).json({
        success: true,
        data: createdList,
        message: 'List created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/lists/:id
   * Update an existing list
   * @param req - Express request object with user authentication
   * @param res - Express response object
   * @param next - Express next function
   */
  async updateList(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      const listId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      if (!listId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'List ID is required'
          }
        });
        return;
      }

      const { name, description } = req.body;

      // Validate that at least one field is provided
      if (name === undefined && description === undefined) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one field (name or description) must be provided'
          }
        });
        return;
      }

      const updates: UpdateListInput = {};
      
      if (name !== undefined) {
        updates.name = name?.trim();
      }
      
      if (description !== undefined) {
        updates.description = description?.trim();
      }

      const updatedList = await this.listsService.updateList(listId, updates, userId);

      res.status(200).json({
        success: true,
        data: updatedList,
        message: 'List updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/lists/:id
   * Delete a list
   * @param req - Express request object with user authentication
   * @param res - Express response object
   * @param next - Express next function
   */
  async deleteList(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      const listId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      if (!listId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'List ID is required'
          }
        });
        return;
      }

      // Parse query parameters for delete options
      const force = req.query.force === 'true';
      const options: DeleteListOptions = { force };

      await this.listsService.deleteList(listId, userId, options);

      res.status(200).json({
        success: true,
        data: null,
        message: 'List deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/lists/statistics
   * Get list statistics for the authenticated user
   * @param req - Express request object with user authentication
   * @param res - Express response object
   * @param next - Express next function
   */
  async getListStatistics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      const statistics = await this.listsService.getListStatistics(userId);

      res.status(200).json({
        success: true,
        data: statistics,
        message: 'List statistics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

/**
 * Factory function to create lists controller with dependencies
 * @param listsService - Lists service instance
 * @returns Configured lists controller
 */
export function createListsController(listsService: ListsService): ListsController {
  return new ListsController(listsService);
}