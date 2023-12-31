import { TOrder, TUser } from './user.interface';
import { UserModel } from './user.model';

async function addSingleUserToDB(userData: TUser) {
  if (await UserModel.isUserExist(userData.userId)) {
    throw new Error('User already exists');
  }
  return await UserModel.create(userData);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}
async function getUsers() {
  // return await UserModel.aggregate([
  //   {
  //     $project: {
  //       _id: 0,
  //       username: 1,
  //       fullName: { firstName: 1, lastName: 1 },
  //       age: 1,
  //       email: 1,
  //       address: { street: 1, city: 1, country: 1 },
  //     },
  //   },
  // ]);
  return await UserModel.find(
    {},
    {
      _id: 0,
      username: 1,
      'fullName.firstName': 1,
      'fullName.lastName': 1,
      age: 1,
      email: 1,
      'address.street': 1,
      'address.city': 1,
      'address.country': 1,
    },
  );
}

async function getUserById(userId: number) {
  if (!(await UserModel.isUserExist(userId))) {
    return null;
  }
  return await UserModel.findOne(
    { userId },
    {
      _id: 0,
      password: 0,
      'fullName._id': 0,
      'address._id': 0,
      isDeleted: 0,
      createdAt: 0,
      updatedAt: 0,
      orders: 0,
      __v: 0,
    },
  );
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUserByFilter(filter: any) {
  return await UserModel.aggregate([
    {
      $match: filter,
      $project: {
        _id: 0,
        username: 1,
        fullName: { firstName: 1, lastName: 1 },
        age: 1,
        email: 1,
        address: { street: 1, city: 1, country: 1 },
      },
    },
  ]);
}

async function updateSingleUserByUserId(
  userId: number,
  updateBody: Partial<TUser>,
) {
  console.log('updateBody', updateBody);
  const userExist = await UserModel.isUserExist(userId);
  if (!userExist) {
    return null;
  }
  if (
    updateBody.userId &&
    updateBody.userId !== userId &&
    (await UserModel.findOne({ userId: updateBody.userId }))
  ) {
    throw new Error(
      'User already exist with provide userId in the body. Please change userId',
    );
  } else if (
    updateBody.username &&
    (await UserModel.findOne({
      username: updateBody.username,
      userId: { $ne: userId },
    }))
  ) {
    throw new Error(
      'User already exist with provide username in the body. Please change username',
    );
  }
  //  else if (
  //   (updateBody.userId || updateBody.username) &&
  //   (userExist.userId !== updateBody.userId ||
  //     userExist.username !== updateBody.username)
  // ) {
  //   let user: TUser | null;
  //   if (updateBody.userId && userExist.userId !== updateBody.userId) {
  //     console.log('if block');
  //     user = await UserModel.findOne({
  //       userId: { $eq: updateBody.userId, $ne: userExist.userId },
  //     });
  //   } else {
  //     console.log('else block', updateBody);
  //     console.log('updateBody.username', updateBody.username);
  //     user = await UserModel.findOne({
  //       username: { $eq: updateBody.username, $ne: userExist.username },
  //     });
  //   }
  //   console.log('user=>', user);
  //   if (user) {
  //     throw new Error(`Duplicate user found with update body id or username`);
  //   }
  // }
  return await UserModel.findByIdAndUpdate(userExist._id, updateBody, {
    new: true,
  });
}
async function deleteSingleUserByUserId(userId: number) {
  const userExist = await UserModel.isUserExist(userId);
  if (!userExist) {
    return null;
  }
  return await UserModel.updateOne({ userId }, { isDeleted: true });
}
async function addProductToUser(userId: number, productData: TOrder) {
  return await UserModel.updateOne(
    { userId },
    { $addToSet: { orders: productData } },
  );
}
async function getOrderByUserId(userId: number) {
  return await UserModel.aggregate([
    {
      $match: { userId },
    },
    {
      $project: {
        _id: 0,
        orders: { productName: 1, quantity: 1, price: 1 },
      },
    },
  ]);
}
async function getOrderTotalPriceByUserId(userId: number) {
  return await UserModel.aggregate([
    {
      $match: { userId },
    },
    {
      $project: {
        _id: 0,
        orders: { productName: 1, quantity: 1, price: 1 },
      },
    },
    {
      $unwind: '$orders',
    },
    {
      $project: {
        total: { $multiply: ['$orders.quantity', '$orders.price'] },
      },
    },
    {
      $group: {
        _id: null,
        totalPrice: { $sum: '$total' },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);
}

export const UserService = {
  addSingleUserToDB,
  getUsers,
  getUserByFilter,
  getUserById,
  updateSingleUserByUserId,
  deleteSingleUserByUserId,
  addProductToUser,
  getOrderByUserId,
  getOrderTotalPriceByUserId,
};
