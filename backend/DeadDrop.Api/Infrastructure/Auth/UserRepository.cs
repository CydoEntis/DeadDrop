using Microsoft.EntityFrameworkCore;
using Pawthorize.Abstractions;
using DeadDrop.Domain.Entities;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Infrastructure.Auth;

public class UserRepository : IUserRepository<User>
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }


    public async Task<User?> FindByIdAsync(string id, CancellationToken cancellationToken = new CancellationToken())
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<User?> FindByEmailAsync(string email,
        CancellationToken cancellationToken = new CancellationToken())
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
    }

    public async Task<User> CreateAsync(User user, CancellationToken cancellationToken = new CancellationToken())
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<User> UpdateAsync(User user, CancellationToken cancellationToken = new CancellationToken())
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<bool> EmailExistsAsync(string email,
        CancellationToken cancellationToken = new CancellationToken())
    {
        return await _context.Users.AnyAsync(u => u.Email == email, cancellationToken);
    }

    public async Task UpdatePasswordAsync(string userId, string newPasswordHash,
        CancellationToken cancellationToken = new CancellationToken())
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null) throw new InvalidOperationException("User not found");

        user.PasswordHash = newPasswordHash;
        _context.Users.Update(user);
        await _context.SaveChangesAsync(cancellationToken);
    }
}