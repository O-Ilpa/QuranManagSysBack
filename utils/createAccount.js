import { hash } from "bcrypt";

const hashpass = async (pass, salt) => {
  const hashedpass = await hash(pass, salt);
  console.log(hashedpass);
};

hashpass("visitor@123", 10);
