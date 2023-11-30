import { Request, Response } from 'express';
import { z } from 'zod';
import { StudentValidation } from './student.validation';
import { UserService } from './user.service';
import bcrypt from 'bcrypt';
import config from '../../config';
import { UserModel } from './user.model';

const validation = async (
  validationSchema: z.ZodSchema,
  dataObj: Record<string, unknown>,
) => await validationSchema.parseAsync(dataObj);

const createUser = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const validationRes = await validation(
      StudentValidation.createUserValidationSchema,
      body,
    );
    validationRes.password = await bcrypt.hash(
      validationRes.password,
      Number(config.bcrypt_salt),
    );
    console.log('validationRes', validationRes);
    const result = await UserService.addSingleUserToDB(validationRes);
    const finalRes: Record<string, unknown> = JSON.parse(
      JSON.stringify(result),
    );
    console.log('finalRes', finalRes);
    delete finalRes.password;
    delete finalRes.orders;

    return res.status(200).json({
      success: true,
      message: 'Successfully created user',
      data: finalRes,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log('Create user Error=>', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        error: {
          code: 400,
          description: 'Zod validation Error',
          error: error.format(),
        },
      });
    } else if (
      error.message === 'User already exists' ||
      error.message === 'Duplicate userId or username'
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.message === 'Duplicate userId or username'
            ? `${error.message}. Please change userId or username`
            : error.message,
        error: {
          code: 400,
          description: error.message,
        },
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      error: {
        code: 500,
        description: 'Something went wrong!',
      },
    });
  }
};
const getUsers = async (req: Request, res: Response) => {
  try {
    const result = await UserService.getUsers();

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully!',
      data: result,
    });
  } catch (error) {
    console.log('Error=>', error);

    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      error: {
        code: 500,
        description: 'Something went wrong!',
      },
    });
  }
};
const getUserByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await UserService.getUserById(Number(userId));
    // console.log('result', result);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'User not found!',
        error: {
          code: 404,
          description: 'User not found!',
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User fetched successfully!',
      data: result,
    });
  } catch (error) {
    console.log('Error=>', error);

    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      error: {
        code: 500,
        description: 'Something went wrong!',
      },
    });
  }
};
const updateSingleUserByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const body = req.body;
    const validationRes = await validation(
      StudentValidation.updateUserValidationSchema,
      body,
    );
    if (validationRes.password) {
      validationRes.password = await bcrypt.hash(
        validationRes.password,
        Number(config.bcrypt_salt),
      );
    }
    const result = await UserService.updateSingleUserByUserId(
      Number(userId),
      validationRes,
    );
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'User not found!',
        error: {
          code: 404,
          description: 'User not found!',
        },
      });
    }
    console.log('result', result);

    return res.status(200).json({
      success: true,
      message: 'User updated successfully!',
      data: result,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log('Error=>', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        error: {
          code: 400,
          description: 'Zod validation Error',
          error: error.format(),
        },
      });
    }
    if (
      error.message === 'Duplicate user found with update body id or username'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: {
          code: 404,
          description: error.message,
        },
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      error: {
        code: 500,
        description: 'Something went wrong!',
      },
    });
  }
};
const deleteSingleUserByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await UserService.deleteSingleUserByUserId(Number(userId));
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'User not found!',
        error: {
          code: 404,
          description: 'User not found!',
        },
      });
    }
    console.log('result', result);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully!',
      data: result,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log('Error=>', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      error: {
        code: 500,
        description: 'Something went wrong!',
      },
    });
  }
};

const addProduct = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const { userId } = req.params;
    const validationRes = await validation(
      StudentValidation.addProductValidationSchema,
      body,
    );
    if (!(await UserModel.findOne({ userId }))) {
      return res.status(404).json({
        success: false,
        message: 'User not found!',
        error: {
          code: 404,
          description: 'User not found!',
        },
      });
    }

    const result = await UserService.addProductToUser(
      Number(userId),
      validationRes,
    );
    if (result.acknowledged && result.modifiedCount > 0) {
      return res.status(200).json({
        success: true,
        message: 'Order created successfully!',
        data: null,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to create order!',
        error: {
          code: 500,
          description: 'Failed to create order',
        },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log('Error=>', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        error: {
          code: 400,
          description: 'Zod validation Error',
          error: error.format(),
        },
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      error: {
        code: 500,
        description: 'Something went wrong!',
      },
    });
  }
};

export const StudentController = {
  createUser,
  getUsers,
  getUserByUserId,
  updateSingleUserByUserId,
  deleteSingleUserByUserId,
  addProduct,
};
