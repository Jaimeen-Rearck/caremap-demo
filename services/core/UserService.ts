import { User } from '@/services/database/migrations/v1/schema_v1';
import { UserModel } from '@/services/database/models/UserModel';
import { logger } from '@/services/logging/logger';
import { useModel } from '@/services/database/BaseModel';

// Single shared instance of model
const userModel = new UserModel();

export const isExistingUser = async (id: string): Promise<boolean> => {
    const existingUser = await getUser(id);
    return !!existingUser;
}

export const createUser = async (user: Partial<User>): Promise<User | null> => {
    return useModel(userModel, async (model) => {
        if (!user.id || !user.email || !user.name) {
            logger.debug("Cannot create user: Missing required fields (id, email, or name)");
            return null;
        }

        const existingUser = await getUser(user.id);
        if (existingUser) {
            logger.debug("User already exists: ", user.id);
            return existingUser;
        }

        const created = await model.insert(user);
        logger.debug("User created: ", created);
        return created;
    });
}

export const getUser = async (id: string): Promise<User | null> => {
    return useModel(userModel, async (model) => {
        const result = await model.getFirstByFields({ id });
        logger.debug("DB User data: ", result);
        return result;
    });
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
    return useModel(userModel, async (model) => {
        const result = await model.getFirstByFields({ email });
        logger.debug("DB User data by email: ", result);
        return result;
    });
}

export const updateUser = async (userUpdate: Partial<User>, whereMap: Partial<User>): Promise<User | null> => {
    return useModel(userModel, async (model) => {
        const existingUser = await model.getFirstByFields(whereMap);
        if (!existingUser) {
            logger.debug("User not found for update: ", whereMap);
            return null;
        }

        const updatedUser = await model.updateByFields(userUpdate, whereMap);
        logger.debug("Updated User: ", updatedUser);
        return updatedUser;
    });
}

export const deleteUser = async (id: string): Promise<boolean> => {
    return useModel(userModel, async (model) => {
        if (!(await isExistingUser(id))) {
            logger.debug("User not found for deletion: ", id);
            return false;
        }

        await model.deleteByFields({ id });
        logger.debug("Deleted User: ", id);
        return true;
    });
}
