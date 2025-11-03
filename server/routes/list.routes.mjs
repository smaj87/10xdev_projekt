/**
 * List API routes
 */
import { authMiddleware } from '../middlewares/auth.middleware.mjs';
import { requireAdmin } from '../middlewares/requireAdmin.middleware.mjs';
import errorLogService from '../services/errorLog.service.mjs';
import listService from '../services/list.service.mjs';
import { registerMethodNotAllowed } from '../utils/methodNotAllowed.mjs';

export default async (fastify) => {
  /**
   * GET /lists
   * Get all lists for authenticated user (as owner)
   */
  fastify.get(
    '/lists',
    {
      preHandler: [authMiddleware],
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;

        // Get all lists owned by the user with tasks and collaborators
        const lists = await listService.getListsByOwnerId(userId);

        return reply.status(200).send(lists);
      } catch (error) {
        await errorLogService.logError({
          user_id: request.user?.id || null,
          endpoint: request.url,
          method: request.method,
          status_code: 500,
          error_message: error.message,
          request_data: null,
          user_agent: request.headers['user-agent'],
        });

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Internal server error',
        });
      }
    },
  );

  /**
   * GET /lists/collaborators
   * Get all lists where authenticated user is a collaborator
   */
  fastify.get(
    '/lists/collaborators',
    {
      preHandler: [authMiddleware],
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;

        // Get all lists where user is a collaborator with tasks and collaborators
        const lists = await listService.getListsAsCollaborator(userId);

        return reply.status(200).send(lists);
      } catch (error) {
        await errorLogService.logError({
          user_id: request.user?.id || null,
          endpoint: request.url,
          method: request.method,
          status_code: 500,
          error_message: error.message,
          request_data: null,
          user_agent: request.headers['user-agent'],
        });

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Internal server error',
        });
      }
    },
  );

  /**
   * PUT /lists
   * Create a new list
   */
  fastify.put(
    '/lists',
    {
      preHandler: [authMiddleware],
      schema: {
        body: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', minLength: 1 },
            category_id: { type: ['integer', 'null'], minimum: 1 },
            priority: { type: 'string', enum: ['low', 'normal', 'high'] },
            due_date: { type: ['string', 'null'], format: 'date' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { category_id, due_date, priority, title } = request.body;
        const userId = request.user.id;

        // Validate category_id if provided
        if (category_id) {
          const categoryExists =
            await listService.validateCategoryExists(category_id);
          if (!categoryExists) {
            const error = {
              statusCode: 400,
              error: 'Bad Request',
              message: `Category with id ${category_id} does not exist`,
            };

            await errorLogService.logError({
              user_id: userId,
              endpoint: request.url,
              method: request.method,
              status_code: 400,
              error_message: error.message,
              request_data: JSON.stringify(request.body),
              user_agent: request.headers['user-agent'],
            });

            return reply.status(400).send(error);
          }
        }

        // Create new list
        const newList = await listService.createList(userId, {
          title,
          category_id,
          priority,
          due_date,
        });

        return reply.status(201).send(newList);
      } catch (error) {
        // Log unexpected errors
        await errorLogService.logError({
          user_id: request.user?.id || null,
          endpoint: request.url,
          method: request.method,
          status_code: 500,
          error_message: error.message,
          request_data: JSON.stringify(request.body),
          user_agent: request.headers['user-agent'],
        });

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Internal server error',
        });
      }
    },
  );

  /**
   * PUT /lists/:listId
   * Update an existing list
   */
  fastify.put(
    '/lists/:listId',
    {
      preHandler: [authMiddleware],
      schema: {
        params: {
          type: 'object',
          required: ['listId'],
          properties: {
            listId: { type: 'integer', minimum: 1 },
          },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1 },
            category_id: { type: ['integer', 'null'], minimum: 1 },
            priority: { type: 'string', enum: ['low', 'normal', 'high'] },
            due_date: { type: ['string', 'null'], format: 'date' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { listId } = request.params;
        const { category_id, due_date, priority, title } = request.body;
        const userId = request.user.id;

        // Validate: at least one field to update
        const hasFieldsToUpdate =
          title !== undefined ||
          category_id !== undefined ||
          priority !== undefined ||
          due_date !== undefined;

        if (!hasFieldsToUpdate) {
          const error = {
            statusCode: 400,
            error: 'Bad Request',
            message: 'At least one field to update is required',
          };

          await errorLogService.logError({
            user_id: userId,
            endpoint: request.url,
            method: request.method,
            status_code: 400,
            error_message: error.message,
            request_data: JSON.stringify(request.body),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(400).send(error);
        }

        // Check if list exists
        const existingList = await listService.getListById(listId);
        if (!existingList) {
          const error = {
            statusCode: 404,
            error: 'Not Found',
            message: `List with id ${listId} not found`,
          };

          await errorLogService.logError({
            user_id: userId,
            endpoint: request.url,
            method: request.method,
            status_code: 404,
            error_message: error.message,
            request_data: JSON.stringify({
              params: request.params,
              body: request.body,
            }),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(404).send(error);
        }

        // Check if user is the owner
        const isOwner = await listService.isListOwner(listId, userId);
        if (!isOwner) {
          const error = {
            statusCode: 403,
            error: 'Forbidden',
            message: 'You are not the owner of this list',
          };

          await errorLogService.logError({
            user_id: userId,
            endpoint: request.url,
            method: request.method,
            status_code: 403,
            error_message: error.message,
            request_data: JSON.stringify({
              params: request.params,
              body: request.body,
            }),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(403).send(error);
        }

        // Validate category_id if provided
        if (category_id !== undefined && category_id !== null) {
          const categoryExists =
            await listService.validateCategoryExists(category_id);
          if (!categoryExists) {
            const error = {
              statusCode: 400,
              error: 'Bad Request',
              message: `Category with id ${category_id} does not exist`,
            };

            await errorLogService.logError({
              user_id: userId,
              endpoint: request.url,
              method: request.method,
              status_code: 400,
              error_message: error.message,
              request_data: JSON.stringify({
                params: request.params,
                body: request.body,
              }),
              user_agent: request.headers['user-agent'],
            });

            return reply.status(400).send(error);
          }
        }

        // Update the list
        const updatedList = await listService.updateList(listId, userId, {
          title,
          category_id,
          priority,
          due_date,
        });

        return reply.status(200).send(updatedList);
      } catch (error) {
        // Log unexpected errors
        await errorLogService.logError({
          user_id: request.user?.id || null,
          endpoint: request.url,
          method: request.method,
          status_code: 500,
          error_message: error.message,
          request_data: JSON.stringify({
            params: request.params,
            body: request.body,
          }),
          user_agent: request.headers['user-agent'],
        });

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Internal server error',
        });
      }
    },
  );

  /**
   * DELETE /lists/:listId
   * Delete an archived list (admin only)
   */
  fastify.delete(
    '/lists/:listId',
    {
      preHandler: [authMiddleware, requireAdmin],
      schema: {
        params: {
          type: 'object',
          required: ['listId'],
          properties: {
            listId: { type: 'integer', minimum: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { listId } = request.params;
        const userId = request.user.id;

        // Check if list exists
        const list = await listService.getListById(listId);
        if (!list) {
          const error = {
            statusCode: 404,
            error: 'Not Found',
            message: `List with id ${listId} not found`,
          };

          await errorLogService.logError({
            user_id: userId,
            endpoint: request.url,
            method: request.method,
            status_code: 404,
            error_message: error.message,
            request_data: JSON.stringify(request.params),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(404).send(error);
        }

        // Check if list is archived
        const isArchived = await listService.isListArchived(listId);
        if (!isArchived) {
          const error = {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Only archived lists can be deleted',
          };

          await errorLogService.logError({
            user_id: userId,
            endpoint: request.url,
            method: request.method,
            status_code: 400,
            error_message: error.message,
            request_data: JSON.stringify(request.params),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(400).send(error);
        }

        // Delete the list (cascading deletion of tasks and collaborators)
        await listService.deleteList(listId);

        return reply.status(204).send();
      } catch (error) {
        // Log unexpected errors
        await errorLogService.logError({
          user_id: request.user?.id || null,
          endpoint: request.url,
          method: request.method,
          status_code: 500,
          error_message: error.message,
          request_data: JSON.stringify(request.params),
          user_agent: request.headers['user-agent'],
        });

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Internal server error',
        });
      }
    },
  );

  /**
   * PUT /lists/:listId/collaborators
   * Add a collaborator to a list (owner only)
   */
  fastify.put(
    '/lists/:listId/collaborators',
    {
      preHandler: [authMiddleware],
      schema: {
        params: {
          type: 'object',
          required: ['listId'],
          properties: {
            listId: { type: 'integer', minimum: 1 },
          },
        },
        body: {
          type: 'object',
          required: ['user_id'],
          properties: {
            user_id: { type: 'integer', minimum: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { listId } = request.params;
        const { user_id: collaboratorUserId } = request.body;
        const userId = request.user.id;

        // Check if list exists
        const existingList = await listService.getListById(listId);
        if (!existingList) {
          const error = {
            statusCode: 404,
            error: 'Not Found',
            message: `List with id ${listId} not found`,
          };

          await errorLogService.logError({
            user_id: userId,
            endpoint: request.url,
            method: request.method,
            status_code: 404,
            error_message: error.message,
            request_data: JSON.stringify({
              params: request.params,
              body: request.body,
            }),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(404).send(error);
        }

        // Check if user is the owner
        const isOwner = await listService.isListOwner(listId, userId);
        if (!isOwner) {
          const error = {
            statusCode: 403,
            error: 'Forbidden',
            message: 'You are not the owner of this list',
          };

          await errorLogService.logError({
            user_id: userId,
            endpoint: request.url,
            method: request.method,
            status_code: 403,
            error_message: error.message,
            request_data: JSON.stringify({
              params: request.params,
              body: request.body,
            }),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(403).send(error);
        }

        // Check if the collaborator user exists
        const collaboratorExists =
          await listService.userExists(collaboratorUserId);
        if (!collaboratorExists) {
          const error = {
            statusCode: 400,
            error: 'Bad Request',
            message: `User with id ${collaboratorUserId} does not exist`,
          };

          await errorLogService.logError({
            user_id: userId,
            endpoint: request.url,
            method: request.method,
            status_code: 400,
            error_message: error.message,
            request_data: JSON.stringify({
              params: request.params,
              body: request.body,
            }),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(400).send(error);
        }

        // Check if user is trying to add themselves as a collaborator
        if (collaboratorUserId === userId) {
          const error = {
            statusCode: 400,
            error: 'Bad Request',
            message: 'You cannot add yourself as a collaborator',
          };

          await errorLogService.logError({
            user_id: userId,
            endpoint: request.url,
            method: request.method,
            status_code: 400,
            error_message: error.message,
            request_data: JSON.stringify({
              params: request.params,
              body: request.body,
            }),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(400).send(error);
        }

        // Check if user is already a collaborator
        const isAlreadyCollaborator = await listService.isCollaborator(
          listId,
          collaboratorUserId,
        );
        if (isAlreadyCollaborator) {
          const error = {
            statusCode: 400,
            error: 'Bad Request',
            message: 'User is already a collaborator on this list',
          };

          await errorLogService.logError({
            user_id: userId,
            endpoint: request.url,
            method: request.method,
            status_code: 400,
            error_message: error.message,
            request_data: JSON.stringify({
              params: request.params,
              body: request.body,
            }),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(400).send(error);
        }

        // Add the collaborator
        const newCollaborator = await listService.addCollaborator(
          listId,
          collaboratorUserId,
        );

        return reply.status(201).send(newCollaborator);
      } catch (error) {
        // Log unexpected errors
        await errorLogService.logError({
          user_id: request.user?.id || null,
          endpoint: request.url,
          method: request.method,
          status_code: 500,
          error_message: error.message,
          request_data: JSON.stringify({
            params: request.params,
            body: request.body,
          }),
          user_agent: request.headers['user-agent'],
        });

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Internal server error',
        });
      }
    },
  );

  /**
   * DELETE /lists/:listId/collaborators/:collaboratorId
   * Remove a collaborator from a list (owner only)
   */
  fastify.delete(
    '/lists/:listId/collaborators/:collaboratorId',
    {
      preHandler: [authMiddleware],
      schema: {
        params: {
          type: 'object',
          required: ['listId', 'collaboratorId'],
          properties: {
            listId: { type: 'integer', minimum: 1 },
            collaboratorId: { type: 'integer', minimum: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { collaboratorId, listId } = request.params;
        const userId = request.user.id;

        // Check if list exists
        const existingList = await listService.getListById(listId);
        if (!existingList) {
          const error = {
            statusCode: 404,
            error: 'Not Found',
            message: `List with id ${listId} not found`,
          };

          await errorLogService.logError({
            user_id: userId,
            endpoint: request.url,
            method: request.method,
            status_code: 404,
            error_message: error.message,
            request_data: JSON.stringify(request.params),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(404).send(error);
        }

        // Check if user is the owner
        const isOwner = await listService.isListOwner(listId, userId);
        if (!isOwner) {
          const error = {
            statusCode: 403,
            error: 'Forbidden',
            message: 'You are not the owner of this list',
          };

          await errorLogService.logError({
            user_id: userId,
            endpoint: request.url,
            method: request.method,
            status_code: 403,
            error_message: error.message,
            request_data: JSON.stringify(request.params),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(403).send(error);
        }

        // Check if collaborator exists
        const collaborator =
          await listService.getCollaboratorById(collaboratorId);
        if (!collaborator) {
          const error = {
            statusCode: 404,
            error: 'Not Found',
            message: `Collaborator with id ${collaboratorId} not found`,
          };

          await errorLogService.logError({
            user_id: userId,
            endpoint: request.url,
            method: request.method,
            status_code: 404,
            error_message: error.message,
            request_data: JSON.stringify(request.params),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(404).send(error);
        }

        // Verify that the collaborator belongs to this list
        if (collaborator.list_id !== listId) {
          const error = {
            statusCode: 400,
            error: 'Bad Request',
            message: `Collaborator with id ${collaboratorId} does not belong to list ${listId}`,
          };

          await errorLogService.logError({
            user_id: userId,
            endpoint: request.url,
            method: request.method,
            status_code: 400,
            error_message: error.message,
            request_data: JSON.stringify(request.params),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(400).send(error);
        }

        // Remove the collaborator
        await listService.removeCollaborator(listId, collaboratorId);

        return reply.status(204).send();
      } catch (error) {
        // Log unexpected errors
        await errorLogService.logError({
          user_id: request.user?.id || null,
          endpoint: request.url,
          method: request.method,
          status_code: 500,
          error_message: error.message,
          request_data: JSON.stringify(request.params),
          user_agent: request.headers['user-agent'],
        });

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Internal server error',
        });
      }
    },
  );

  // Register Method Not Allowed for unsupported methods
  registerMethodNotAllowed(fastify, '/lists', ['POST', 'PATCH', 'DELETE']);
  registerMethodNotAllowed(fastify, '/lists/collaborators', [
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
  ]);
  registerMethodNotAllowed(fastify, '/lists/:listId', ['GET', 'POST', 'PATCH']);
  registerMethodNotAllowed(fastify, '/lists/:listId/archive', [
    'GET',
    'POST',
    'PATCH',
    'DELETE',
  ]);
  registerMethodNotAllowed(fastify, '/lists/:listId/collaborators', [
    'GET',
    'POST',
    'PATCH',
    'DELETE',
  ]);
  registerMethodNotAllowed(
    fastify,
    '/lists/:listId/collaborators/:collaboratorId',
    ['GET', 'POST', 'PUT', 'PATCH'],
  );
};
