const fs = require('fs').promises;
const path = require('path');

class FileHandler {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.ensureDataDirectory();
  }

  async ensureDataDirectory() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  async readFile(filename) {
    try {
      const filePath = path.join(this.dataDir, filename);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async writeFile(filename, data) {
    const filePath = path.join(this.dataDir, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async appendToFile(filename, newData) {
    const existingData = await this.readFile(filename);
    const updatedData = Array.isArray(existingData) 
      ? [...existingData, newData]
      : { ...existingData, ...newData };
    await this.writeFile(filename, updatedData);
    return updatedData;
  }

  async updateInFile(filename, id, updatedData) {
    const data = await this.readFile(filename);
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updatedData };
      await this.writeFile(filename, data);
      return data[index];
    }
    return null;
  }

  async deleteFromFile(filename, id) {
    const data = await this.readFile(filename);
    const filteredData = data.filter(item => item.id !== id);
    await this.writeFile(filename, filteredData);
    return filteredData;
  }
}

module.exports = new FileHandler();