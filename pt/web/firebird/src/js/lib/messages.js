const messages = {};
messages['ownerid'] = {
  alert: `This may not have been your link's destination.`,
  detail: `
  <p>The link you followed was meant to go to a specific page 
  by way of a version signature; unfortunately the signature 
  could not be resolved.</p>
  <p>We would recommend contacting the owner of the 
  referring website to let them know that their link 
  may need to be updated.</p>`,
};

export { messages };
