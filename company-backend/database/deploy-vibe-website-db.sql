IF DB_ID(N'VibeWebsiteDb') IS NULL
BEGIN
  PRINT N'Không tìm thấy database VibeWebsiteDb. Hãy tạo database này trên Azure SQL trước.';
END
GO

USE VibeWebsiteDb;
GO

IF OBJECT_ID(N'dbo.ContactMessages', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.ContactMessages (
    Id INT IDENTITY(1, 1) PRIMARY KEY,
    FullName NVARCHAR(150) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(30) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    SubmittedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

SELECT TOP 5
  Id,
  FullName,
  Email,
  Phone,
  Message,
  SubmittedAt
FROM dbo.ContactMessages
ORDER BY Id DESC;
