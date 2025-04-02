import projectModel from '../models/project.model.js';
import * as projectService from '../services/project.service.js';
import userModel from '../models/user.model.js';
import { validationResult } from 'express-validator';

export const createProject = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { name } = req.body;
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        const userId = loggedInUser._id;
       

        const newProject = await projectService.createProject({ name, userId });

        res.status(201).json(newProject);

    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }



}

export const getAllProject = async (req, res) => {
    try {

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })

        const allUserProjects = await projectService.getAllProjectByUserId({
            userId: loggedInUser._id
        })

        return res.status(200).json({
            projects: allUserProjects
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }
}

export const addUserToProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { projectId, users } = req.body

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })


        const project = await projectService.addUsersToProject({
            projectId,
            users,
            userId: loggedInUser._id
        })

        return res.status(200).json({
            project,
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }


}

export const getProjectById = async (req, res) => {

    const { projectId } = req.params;

    try {

        const project = await projectService.getProjectById({ projectId });
        
        // Populate sender information for each message
        if (project.messages && project.messages.length > 0) {
            await Promise.all(project.messages.map(async (message) => {
            const sender = await userModel.findById(message.sender);
            message.sender = sender;
            }));
        }

        return res.status(200).json({
            project
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }

}

export const updateFileTree = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { projectId, fileTree } = req.body;
       console.log(req.body);
       
        const project = await projectService.updateFileTree({
            projectId,
            fileTree
        })

        return res.status(200).json({
            project
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }

}




export const addMessages = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId } = req.params;
        const { message } = req.body; // Fix to accept a single `message`

        const loggedInUser = await userModel.findOne({ email: req.user.email });

        const updatedProject = await projectService.addMessage({
            projectId,
            message,
            senderId: loggedInUser._id,
        });

        return res.status(200).json({ project: updatedProject });
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
};

export const deleteFile = async (req, res) => {
  try {
    const { projectId, fileName } = req.params;
    
    
    const project = await projectModel.findById(projectId);
    
    
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    
    
    const parts = fileName.split('/');
    let current = project.fileTree;
    
    // Navigate through the file tree
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]]) {
        current = current[parts[i]];
      } else {
        return res.status(404).json({ message: 'File not found' });
      }
    }
    
    const lastPart = parts[parts.length - 1];
    if (lastPart in current) {
      delete current[lastPart];
      project.markModified('fileTree');
      await project.save();
      return res.status(200).json({ message: 'File deleted successfully' });
    }
    
    return res.status(404).json({ message: 'File not found' });
    
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


