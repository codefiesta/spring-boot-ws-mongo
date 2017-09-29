package com.example.controllers;

import java.util.List;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.util.Assert;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.example.models.User;
import com.example.repository.UserRepository;

@RestController
public class UserController implements InitializingBean {

	@Autowired
	private SimpMessagingTemplate template;
	@Autowired
	private UserRepository repository;

	/**
	 * Sending a message directly from the websocket client.
	 * @param message
	 * @return
	 * @throws Exception
	 */
	@MessageMapping("/users/list")
	@SendTo("/topic/users/list")
	public List<User> list() throws Exception {
		return repository.findAll();
	}

	/**
	 * Web-Socket handler.
	 * @param destination
	 * @param user
	 * @throws Exception
	 */
	@MessageMapping("/users/{destination}")
	public void webSocketHandler(@DestinationVariable String destination, User user) throws Exception {

		if (destination == null) {
			return;
		}
		
		if ("add".equals(destination)) {
			user = repository.save(user);
		} else if ("remove".equals(destination)) {
			System.out.println("REMOVING: " + user.getId());
			repository.delete(user.getId());
		}		
		template.convertAndSend("/topic/users/" + destination, user);
	}

	/**
	 * API Handler. Examples: 
	 * 	curl -F "name=Kevin" -X POST "http://localhost/api/users/add"
	 * 	curl -F "id={USER_ID}" -X POST "http://localhost/api/users/remove"
	 * @param destination
	 * @param user
	 */
	@RequestMapping(value = "/api/users/{destination}", method = RequestMethod.POST)
	public void apiHandler(@PathVariable("destination") String destination, @ModelAttribute User user) throws Exception {
		webSocketHandler(destination, user);
	}
	
	@Override
	public void afterPropertiesSet() throws Exception {
		Assert.notNull(template, "Template is null!");
		Assert.notNull(repository, "Repo is null!");
	}
}
