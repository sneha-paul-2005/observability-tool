const axios = require('axios');
const Service = require('../models/service.model');

// Register a new service to monitor
const registerService = async (req, res) => {
  try {
    const { name, url } = req.body;

    const existing = await Service.findOne({ name });
    if (existing) {
      return res.status(400).json({ error: 'Service with this name already exists' });
    }

    const service = await Service.create({ name, url });
    res.status(201).json({ message: 'Service registered', service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all monitored services
const getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json({ services, count: services.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check health of a single service
const checkServiceHealth = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const startTime = Date.now();
    let status = 'down';
    let statusCode = null;

    try {
      const response = await axios.get(service.url, { timeout: 5000 });
      statusCode = response.status;
      status = response.status >= 200 && response.status < 400 ? 'up' : 'down';
    } catch (error) {
      status = 'down';
      statusCode = error.response?.status || null;
    }

    const responseTime = Date.now() - startTime;

    service.status = status;
    service.lastChecked = new Date();
    service.lastResponseTime = responseTime;
    service.lastStatusCode = statusCode;
    await service.save();

    res.json({ service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check health of ALL registered services
const checkAllServices = async (req, res) => {
  try {
    const services = await Service.find();

    const results = await Promise.all(
      services.map(async (service) => {
        const startTime = Date.now();
        let status = 'down';
        let statusCode = null;

        try {
          const response = await axios.get(service.url, { timeout: 5000 });
          statusCode = response.status;
          status = response.status >= 200 && response.status < 400 ? 'up' : 'down';
        } catch (error) {
          status = 'down';
          statusCode = error.response?.status || null;
        }

        const responseTime = Date.now() - startTime;

        service.status = status;
        service.lastChecked = new Date();
        service.lastResponseTime = responseTime;
        service.lastStatusCode = statusCode;
        await service.save();

        return service;
      })
    );

    res.json({ services: results, count: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a service
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await Service.findByIdAndDelete(id);
    res.json({ message: 'Service removed from monitoring' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registerService, getServices, checkServiceHealth, checkAllServices, deleteService };