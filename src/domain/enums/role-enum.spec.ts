import { Role } from "@/domain/enums/role-enum";

describe("Role", () => {
  it("should have Admin value", () => {
    expect(Role.Admin).toBe("ADMIN");
  });

  it("should have Default value", () => {
    expect(Role.Default).toBe("DEFAULT");
  });
});
