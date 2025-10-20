"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils/utils";
import DeleteConfirmation from "@/components/ui/delete-confirmation";

const Home = () => {
  const [users, setUsers] = useState([
    {
      id: "1",
      name: "Hung Dinh",
      email: "john.doe@example.com",
      role: "SYSTEM_ADMIN",
    },
    {
      id: "2",
      name: "Nguyen Van A",
      email: "jane.doe@example.com",
      role: "REVIEWER",
    },
    {
      id: "3",
      name: "Nguyen Van B",
      email: "jim.doe@example.com",
      role: "READER",
    },
    {
      id: "4",
      name: "Nguyen Van C",
      email: "jill.doe@example.com",
      role: "ORGANIZATION",
    },
  ]);


  const handleDeleteUser = async (id: string | number) => {
    const userId = typeof id === 'string' ? id : id.toString();
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Ví dụ nếu dùng service thật:
    // await userService.deleteUser(userId);
    
    // Remove user from list
    setUsers(prev => prev.filter(user => user.id !== userId));
    
    console.log(`Deleted user with id: ${userId}`);
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 text-dark dark:text-white" >Users</h1>
      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead className="min-w-[155px] xl:pl-7.5">Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right xl:pr-7.5">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user, index) => (
            <TableRow key={index} className="border-[#eee] dark:border-dark-3">
              <TableCell className="min-w-[155px] xl:pl-7.5">
                <h5 className="text-dark dark:text-white">{user.name}</h5>
                <p className="mt-[3px] text-body-sm font-medium">
                  {user.id}
                </p>
              </TableCell>

              <TableCell>
                <p className="text-dark dark:text-white">
                  {user.email}
                </p>
              </TableCell>

              <TableCell>
                <div
                  className={cn(
                    "max-w-fit rounded-full px-3.5 py-1 text-sm font-medium",
                    {
                      "bg-[#219653]/[0.08] text-[#219653]":
                        user.role === "SYSTEM_ADMIN",
                      "bg-[#D34053]/[0.08] text-[#D34053]":
                        user.role === "REVIEWER",
                      "bg-[#FFA70B]/[0.08] text-[#FFA70B]":
                        user.role === "READER",
                    },
                  )}
                >
                  {user.role}
                </div>
              </TableCell>

              <TableCell className="xl:pr-7.5">
                <div className="flex items-center justify-end gap-x-3.5">
                  <DeleteConfirmation
                    onDelete={handleDeleteUser}
                    itemId={user.id}
                    itemName={user.name}
                    title="Delete User"
                    description={`Are you sure you want to delete user "${user.name}"?`}
                    size="sm"
                    variant="text"
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default Home;